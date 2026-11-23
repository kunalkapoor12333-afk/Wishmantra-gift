import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  createAdminToken,
  extractBearerToken,
  getAdminPasscode,
  requireAdmin,
  verifyAdminToken,
} from './server/auth.ts';
import { StoreDatabase, type DbProductInput } from './server/db.ts';
import { askWishy, formatGeminiApiError } from './server/wishy.ts';
import {
  validateCheckoutForm,
  validateEnquiryForm,
  type CheckoutForm,
  type EnquiryStatus,
  type ImageKey,
  type OrderStatus,
  type PersonalisationOptions,
  type SiteSettings,
} from './src/utils/storeLogic.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const db = new StoreDatabase();
const app = express();

app.use(express.json({ limit: '1mb' }));

// Public Health & Storefront APIs
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/wishmantra-website.zip', (_req, res) => {
  const zipPath = path.join(process.cwd(), 'wishmantra-website.zip');
  if (!fs.existsSync(zipPath)) {
    res.status(404).json({ error: 'Website archive not found.' });
    return;
  }
  res.download(zipPath, 'wishmantra-website.zip');
});

app.get('/api/products', (_req, res) => {
  const products = db.listProducts(false);
  res.json({ products });
});

app.get('/api/settings', (_req, res) => {
  const settings = db.getSiteSettings();
  res.json({ settings });
});

app.post('/api/enquiries', (req, res) => {
  const body = req.body as {
    customerName?: string;
    phone?: string;
    city?: string;
    subject?: string;
    message?: string;
  };
  const clean = {
    customerName: body?.customerName ?? '',
    phone: body?.phone ?? '',
    city: body?.city ?? '',
    subject: body?.subject ?? '',
    message: body?.message ?? '',
  };
  const fieldErrors = validateEnquiryForm(clean);
  if (Object.keys(fieldErrors).length > 0) {
    res.status(400).json({
      error: 'Please fill out all enquiry fields.',
      fieldErrors,
    });
    return;
  }
  const enquiry = db.createEnquiry(clean);
  res.status(201).json({ enquiry });
});

app.post('/api/orders', (req, res) => {
  const body = req.body as {
    form?: CheckoutForm;
    items?: Array<{
      productId: string;
      quantity: number;
      personalisation?: PersonalisationOptions;
    }>;
  };

  if (!body?.form || !Array.isArray(body.items) || body.items.length === 0) {
    res.status(400).json({ error: 'Order items and billing details are required.' });
    return;
  }

  const formErrors = validateCheckoutForm(body.form);
  if (Object.keys(formErrors).length > 0) {
    res.status(400).json({
      error: 'Please complete all required billing fields.',
      fieldErrors: formErrors,
    });
    return;
  }

  const allowedMethods = new Set(['cod', 'upi', 'whatsapp', 'store']);
  const safeForm: CheckoutForm = {
    ...body.form,
    paymentMethod: allowedMethods.has(body.form.paymentMethod)
      ? body.form.paymentMethod
      : 'cod',
  };

  try {
    const order = db.createOrder({
      form: safeForm,
      items: body.items,
    });
    res.status(201).json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to generate bill.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/wishy', async (req, res) => {
  const body = req.body as {
    message?: string;
    history?: Array<{ role?: string; text?: string }>;
  };
  const message = (body?.message ?? '').trim();
  if (!message || message.length > 600) {
    res.status(400).json({
      error: 'Please enter a gift question between 1 and 600 characters.',
    });
    return;
  }

  const products = db.listProducts(false);
  const settings = db.getSiteSettings();

  try {
    const result = await askWishy({
      message,
      history: body?.history,
      products,
      settings,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const recommendedProducts = result.recommendedProductIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    res.json({
      reply: result.reply,
      recommendedProducts,
      followUpPrompts: result.followUpPrompts,
    });
  } catch (err) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode;
    if (statusCode === 503) {
      res.status(503).json({
        error:
          err instanceof Error
            ? err.message
            : 'Wishy AI service requires GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }
    const formatted = formatGeminiApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

// Admin Authentication APIs
app.post('/api/admin/login', (req, res) => {
  const body = req.body as { passcode?: string };
  const submitted = (body?.passcode ?? '').trim();
  if (!submitted) {
    res.status(400).json({ error: 'Please enter the studio passcode.' });
    return;
  }
  if (submitted !== getAdminPasscode()) {
    res.status(401).json({ error: 'Incorrect passcode. Please try again.' });
    return;
  }
  const token = createAdminToken();
  res.json({ token, authenticated: true });
});

app.get('/api/admin/session', (req, res) => {
  const token = extractBearerToken(req);
  res.json({ authenticated: verifyAdminToken(token) });
});

// Protected Admin Workspace APIs
app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  const summary = db.getDashboardSummary();
  const orders = db.listOrders();
  const products = db.listProducts(true);
  const categories = db.listCategories();
  const customers = db.listCustomers();
  const enquiries = db.listEnquiries();
  const bestSellers = db.getBestSellingProducts(5);
  const salesSeries = db.getSalesOverview(7);
  const settings = db.getSiteSettings();
  res.json({
    summary,
    orders,
    products,
    categories,
    customers,
    enquiries,
    bestSellers,
    salesSeries,
    settings,
  });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const body = req.body as Partial<DbProductInput>;
  if (!body?.name || body.name.trim().length < 2) {
    res.status(400).json({ error: 'Product name must be at least 2 characters.' });
    return;
  }
  if (!body.price || Number(body.price) <= 0) {
    res.status(400).json({ error: 'Price must be greater than zero.' });
    return;
  }

  const product = db.createProduct({
    name: body.name,
    category: body.category || 'Customised Gifts',
    price: Number(body.price),
    unitLabel: body.unitLabel || 'per set',
    shortDescription: body.shortDescription || 'Curated at WishMantra Gift Gallery.',
    details:
      body.details ||
      body.shortDescription ||
      'Crafted and packed at Sadar Bazaar, Ambala Cantt.',
    customisable: Boolean(body.customisable ?? true),
    personalisationFee: Number(body.personalisationFee ?? 0),
    imageKey: (body.imageKey || 'product_custom_hamper') as ImageKey,
    imageAlt: body.imageAlt || body.name,
    highlight: body.highlight || null,
    inStock: body.inStock !== undefined ? Boolean(body.inStock) : true,
    stockQty: body.stockQty !== undefined ? Number(body.stockQty) : 15,
    lowStockThreshold:
      body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : 5,
  });

  res.status(201).json({ product });
});

app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const patch = req.body as Partial<DbProductInput>;
  if (patch.price !== undefined && Number(patch.price) <= 0) {
    res.status(400).json({ error: 'Price must be greater than zero.' });
    return;
  }

  const updated = db.updateProduct(id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ product: updated });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ deleted: true });
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const body = req.body as { name?: string; description?: string };
  try {
    const category = db.createCategory({
      name: body?.name ?? '',
      description: body?.description ?? '',
    });
    res.status(201).json({ category });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to create category.';
    res.status(400).json({ error: msg });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  try {
    const deleted = db.deleteCategory(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to delete category.';
    res.status(400).json({ error: msg });
  }
});

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as { status?: OrderStatus; adminNotes?: string };
  if (!body?.status) {
    res.status(400).json({ error: 'Order status is required.' });
    return;
  }
  try {
    const updated = db.updateOrderStatus(id, body.status, body.adminNotes);
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid status update.';
    res.status(400).json({ error: msg });
  }
});

app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as { status?: EnquiryStatus; adminReply?: string };
  if (!body?.status) {
    res.status(400).json({ error: 'Enquiry status is required.' });
    return;
  }
  try {
    const updated = db.updateEnquiryStatus(id, body.status, body.adminReply);
    if (!updated) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    res.json({ enquiry: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid enquiry update.';
    res.status(400).json({ error: msg });
  }
});

app.patch('/api/admin/settings', requireAdmin, (req, res) => {
  const patch = req.body as Partial<SiteSettings>;
  const settings = db.updateSiteSettings(patch);
  res.json({ settings });
});

async function startServer() {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WishMantra full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
