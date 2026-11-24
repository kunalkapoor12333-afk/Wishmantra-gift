import { resolveProductImage } from '../data/catalog';
import type {
  AdminDashboardSummary,
  BestSellerStat,
  CategoryRecord,
  CheckoutForm,
  CustomerSummary,
  EnquiryRecord,
  EnquiryStatus,
  ImageKey,
  OrderRecord,
  OrderStatus,
  PersonalisationOptions,
  Product,
  SalesDayPoint,
  SiteSettings,
} from './storeLogic';

let memoryAdminToken: string | null = null;

export function getStoredAdminToken(): string | null {
  return memoryAdminToken;
}

export function setStoredAdminToken(token: string | null): void {
  memoryAdminToken = token;
}

function hydrateProduct(raw: Product): Product {
  return {
    ...raw,
    imageKey: (raw.imageKey || raw.image) as ImageKey,
    image: resolveProductImage(raw.image),
  };
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchPublicProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  const data = await parseJsonResponse<{ products: Product[] }>(res);
  return data.products.map(hydrateProduct);
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/settings');
  const data = await parseJsonResponse<{ settings: SiteSettings }>(res);
  return data.settings;
}

export async function submitEnquiry(payload: {
  customerName: string;
  phone: string;
  city?: string;
  subject: string;
  message: string;
}): Promise<EnquiryRecord> {
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{ enquiry: EnquiryRecord }>(res);
  return data.enquiry;
}

export async function submitOrder(payload: {
  form: CheckoutForm;
  items: Array<{
    productId: string;
    quantity: number;
    personalisation?: PersonalisationOptions;
  }>;
}): Promise<OrderRecord> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{ order: OrderRecord }>(res);
  return data.order;
}

export async function askWishyChat(payload: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<{
  reply: string;
  recommendedProducts: Product[];
  followUpPrompts: string[];
}> {
  const res = await fetch('/api/wishy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{
    reply: string;
    recommendedProducts: Product[];
    followUpPrompts: string[];
  }>(res);
  return {
    reply: data.reply,
    recommendedProducts: (data.recommendedProducts ?? []).map(hydrateProduct),
    followUpPrompts: data.followUpPrompts ?? [],
  };
}

export async function setupAdminPasscode(passcode: string): Promise<string> {
  const res = await fetch('/api/admin/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const data = await parseJsonResponse<{ token: string }>(res);
  setStoredAdminToken(data.token);
  return data.token;
}

export async function loginAdmin(passcode: string): Promise<string> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const data = await parseJsonResponse<{ token: string }>(res);
  setStoredAdminToken(data.token);
  return data.token;
}

export async function checkAdminSessionStatus(): Promise<{
  authenticated: boolean;
  setupRequired: boolean;
}> {
  const token = getStoredAdminToken();
  try {
    const res = await fetch('/api/admin/session', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return { authenticated: false, setupRequired: false };
    const data = (await res.json()) as {
      authenticated?: boolean;
      setupRequired?: boolean;
    };
    if (!data.authenticated) {
      setStoredAdminToken(null);
    }
    return {
      authenticated: Boolean(data.authenticated),
      setupRequired: Boolean(data.setupRequired),
    };
  } catch {
    return { authenticated: false, setupRequired: false };
  }
}

export async function checkAdminSession(): Promise<boolean> {
  const status = await checkAdminSessionStatus();
  return status.authenticated;
}

function adminHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AdminDashboardPayload {
  summary: AdminDashboardSummary;
  orders: OrderRecord[];
  products: Product[];
  categories: CategoryRecord[];
  customers: CustomerSummary[];
  enquiries: EnquiryRecord[];
  bestSellers: BestSellerStat[];
  salesSeries: SalesDayPoint[];
  settings: SiteSettings;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardPayload> {
  const res = await fetch('/api/admin/dashboard', {
    headers: adminHeaders(),
  });
  const data = await parseJsonResponse<AdminDashboardPayload>(res);
  return {
    ...data,
    products: data.products.map(hydrateProduct),
    bestSellers: data.bestSellers.map((item) => ({
      ...item,
      image: resolveProductImage(item.image),
    })),
  };
}

export interface ProductPayload {
  name: string;
  category: string;
  price: number;
  unitLabel: string;
  shortDescription: string;
  details: string;
  customisable: boolean;
  personalisationFee: number;
  imageKey: ImageKey;
  imageAlt: string;
  highlight?: string | null;
  inStock: boolean;
  stockQty?: number;
  lowStockThreshold?: number;
}

export async function createAdminProduct(payload: ProductPayload): Promise<Product> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{ product: Product }>(res);
  return hydrateProduct(data.product);
}

export async function updateAdminProduct(
  id: string,
  patch: Partial<ProductPayload>
): Promise<Product> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await parseJsonResponse<{ product: Product }>(res);
  return hydrateProduct(data.product);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  await parseJsonResponse<{ deleted: boolean }>(res);
}

export async function createAdminCategory(payload: {
  name: string;
  description?: string;
}): Promise<CategoryRecord> {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<{ category: CategoryRecord }>(res);
  return data.category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  await parseJsonResponse<{ deleted: boolean }>(res);
}

export async function updateAdminOrderStatus(
  id: number,
  status: OrderStatus,
  adminNotes?: string
): Promise<OrderRecord> {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ status, adminNotes }),
  });
  const data = await parseJsonResponse<{ order: OrderRecord }>(res);
  return data.order;
}

export async function updateAdminEnquiryStatus(
  id: number,
  status: EnquiryStatus,
  adminReply?: string
): Promise<EnquiryRecord> {
  const res = await fetch(`/api/admin/enquiries/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ status, adminReply }),
  });
  const data = await parseJsonResponse<{ enquiry: EnquiryRecord }>(res);
  return data.enquiry;
}

export async function updateAdminSettings(
  patch: Partial<SiteSettings>
): Promise<SiteSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await parseJsonResponse<{ settings: SiteSettings }>(res);
  return data.settings;
}
