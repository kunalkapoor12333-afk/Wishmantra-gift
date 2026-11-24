import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  checkAdminLoginRateLimit,
  clearFailedAdminLogins,
  constantTimeEqualText,
  createAdminToken,
  extractBearerToken,
  getConfiguredAdminPasscode,
  hashPasscode,
  recordFailedAdminLogin,
  requireAdmin,
  verifyAdminToken,
  verifyPasscodeHash,
} from './auth.ts';
import { StoreDatabase, type DbProductInput } from './db.ts';
import { askWishy, formatGeminiApiError } from './wishy.ts';
import {
  validateCheckoutForm,
  validateEnquiryForm,
  type CheckoutForm,
  type EnquiryStatus,
  type ImageKey,
  type OrderStatus,
  type PersonalisationOptions,
  type SiteSettings,
} from '../src/utils/storeLogic.ts';

export function createApiApp(options?: { db?: StoreDatabase }) {
  const db = options?.db ?? new StoreDatabase();
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Normalize Netlify Functions rewrite prefix (/.netlify/functions/api/* -> /api/*)
  app.use((req, _res, next) => {
    const prefix = '/.netlify/functions/api';
    if (req.url.startsWith(prefix)) {
      const stripped = req.url.slice(prefix.length) || '/';
      if (stripped.startsWith('/api')) {
        req.url = stripped;
      } else {
        req.url = `/api${stripped.startsWith('/') ? stripped : `/${stripped}`}`;
      }
    }
    next();
  });

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
  app.post('/api/admin/setup', (req, res) => {
    if (getConfiguredAdminPasscode() || db.getAdminPasscodeHash()) {
      res.status(403).json({
        error: 'Admin passcode is already configured. Please sign in normally.',
      });
      return;
    }

    const body = req.body as { passcode?: string };
    const passcode = (body?.passcode ?? '').trim();
    if (passcode.length < 6) {
      res.status(400).json({
        error: 'Choose a studio passcode with at least 6 characters.',
      });
      return;
    }

    const hash = hashPasscode(passcode);
    const claimed = db.claimAdminPasscodeHash(hash);
    if (!claimed) {
      res.status(409).json({
        error: 'Admin passcode was already claimed. Please sign in.',
      });
      return;
    }

    const token = createAdminToken();
    res.status(201).json({ token, authenticated: true });
  });

  app.post('/api/admin/login', (req, res) => {
    const clientIp = req.ip || 'unknown';
    const rate = checkAdminLoginRateLimit(clientIp);
    if (!rate.allowed) {
      res.status(429).json({
        error: `Too many failed attempts. Please wait ${rate.retryAfterSec}s before trying again.`,
      });
      return;
    }

    const body = req.body as { passcode?: string };
    const submitted = (body?.passcode ?? '').trim();
    if (!submitted) {
      res.status(400).json({ error: 'Please enter the studio passcode.' });
      return;
    }

    const envPasscode = getConfiguredAdminPasscode();
    const storedHash = db.getAdminPasscodeHash();

    if (!envPasscode && !storedHash) {
      res.status(403).json({
        error: 'Admin setup required. Create your studio passcode first.',
        setupRequired: true,
      });
      return;
    }

    const verified = envPasscode
      ? constantTimeEqualText(submitted, envPasscode)
      : storedHash
        ? verifyPasscodeHash(submitted, storedHash)
        : false;

    if (!verified) {
      recordFailedAdminLogin(clientIp);
      res.status(401).json({ error: 'Incorrect passcode. Please try again.' });
      return;
    }

    clearFailedAdminLogins(clientIp);
    const token = createAdminToken();
    res.json({ token, authenticated: true });
  });

  app.get('/api/admin/session', (req, res) => {
    const token = extractBearerToken(req);
    const setupRequired = !getConfiguredAdminPasscode() && !db.getAdminPasscodeHash();
    res.json({
      authenticated: verifyAdminToken(token),
      setupRequired,
    });
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
    if (!body.price || Number(body.price) <= 0 || !Number.isFinite(Number(body.price))) {
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
    if (
      patch.price !== undefined &&
      (!Number.isFinite(Number(patch.price)) || Number(patch.price) <= 0)
    ) {
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
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid order ID.' });
      return;
    }
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
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid enquiry ID.' });
      return;
    }
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

  return { app, db };
}
