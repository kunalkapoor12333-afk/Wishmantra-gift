export type ProductCategory =
  | 'Customised Gifts'
  | 'Stationery'
  | 'Gaming'
  | 'Return Gifts'
  | 'Celebration Hampers';

export type SortOption = 'featured' | 'price-asc' | 'price-desc';
export type PriceBand = 'all' | 'under-299' | 'under-499' | '500-999' | '1000-plus';

export type WrapStyle =
  | 'Blush Silk & Kraft'
  | 'Sage Linen Ribbon'
  | 'Plum Velvet Box';

export type ImageKey =
  | 'product_custom_hamper'
  | 'product_stationery_set'
  | 'product_gaming_desk'
  | 'product_return_gifts'
  | 'product_celebration_box'
  | 'hero_gift_gallery'
  | 'product_led_frame'
  | 'product_candle_spa'
  | 'product_gaming_headset'
  | 'product_polaroid_album'
  | 'product_desk_organiser'
  | 'product_chocolate_hamper';

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Dispatched'
  | 'Completed'
  | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Preparing',
  'Ready for Pickup',
  'Dispatched',
  'Completed',
  'Cancelled',
];

export type EnquiryStatus = 'Open' | 'Replied' | 'Resolved';

export const ENQUIRY_STATUSES: EnquiryStatus[] = ['Open', 'Replied', 'Resolved'];

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unitLabel: string;
  shortDescription: string;
  details: string;
  customisable: boolean;
  personalisationFee: number;
  rating: number;
  reviewCount: number;
  image: string;
  imageKey?: ImageKey;
  imageAlt: string;
  highlight?: string;
  inStock?: boolean;
  stockQty?: number;
  lowStockThreshold?: number;
}

export interface CategoryRecord {
  id: string;
  name: string;
  description: string;
  productCount: number;
  activeCount: number;
}

export interface CustomerSummary {
  phone: string;
  name: string;
  email: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderNumber: string;
}

export interface EnquiryRecord {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  adminReply: string;
  createdAt: string;
}

export interface SiteSettings {
  storeName: string;
  announcementText: string;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  phoneDisplay: string;
  address: string;
  hours: string;
  promoCodesEnabled: boolean;
}

export interface BestSellerStat {
  productId: string;
  name: string;
  category: string;
  price: number;
  unitsSold: number;
  revenue: number;
  image: string;
}

export interface SalesDayPoint {
  label: string;
  dateKey: string;
  revenue: number;
  ordersCount: number;
}

export interface PersonalisationOptions {
  customName: string;
  giftNote: string;
  wrapStyle: WrapStyle;
}

export interface CartItem {
  cartKey: string;
  product: Product;
  quantity: number;
  personalisation?: PersonalisationOptions;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  personalisationTotal: number;
  merchandiseTotal: number;
  promoCode: string;
  promoDiscount: number;
  deliveryFee: number;
  freeDeliveryRemaining: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  gstAmount: number;
  total: number;
}

export interface CheckoutForm {
  customerName: string;
  phone: string;
  email?: string;
  gstin?: string;
  fulfilment: 'delivery' | 'pickup';
  address: string;
  cityPincode: string;
  paymentMethod: 'cod' | 'upi' | 'whatsapp' | 'store';
  promoCode?: string;
}

export interface OrderItemRecord {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  personalisationFee: number;
  personalisation?: PersonalisationOptions;
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  gstin: string;
  fulfilment: 'delivery' | 'pickup';
  address: string;
  cityPincode: string;
  paymentMethod: 'cod' | 'upi' | 'whatsapp' | 'store';
  items: OrderItemRecord[];
  subtotal: number;
  personalisationTotal: number;
  promoCode: string;
  promoDiscount: number;
  deliveryFee: number;
  taxableValue: number;
  gstAmount: number;
  totalAmount: number;
  status: OrderStatus;
  adminNotes: string;
  createdAt: string;
}

export interface AdminDashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  activeProducts: number;
  averageBillValue: number;
}

export const FREE_DELIVERY_THRESHOLD = 999;
export const STANDARD_DELIVERY_FEE = 59;
export const GST_RATE_PERCENT = 12;
export const WHATSAPP_NUMBER_INTL = '918950123188';

export const PROMO_CODES: Record<
  string,
  { label: string; type: 'percent' | 'flat'; value: number; minOrder: number }
> = {
  WISH5: {
    label: '5% off gift order',
    type: 'percent',
    value: 5,
    minOrder: 399,
  },
  GIFT100: {
    label: '₹100 off on ₹1,299+',
    type: 'flat',
    value: 100,
    minOrder: 1299,
  },
};

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function filterAndSortProducts(
  products: Product[],
  options: {
    category: 'All' | string;
    query: string;
    sortBy: SortOption;
    priceBand?: PriceBand;
  }
): Product[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  const band = options.priceBand ?? 'all';

  const filtered = products.filter((item) => {
    const matchesCategory =
      options.category === 'All' || item.category === options.category;
    if (!matchesCategory) return false;

    if (band === 'under-299' && item.price > 299) return false;
    if (band === 'under-499' && item.price > 499) return false;
    if (band === '500-999' && (item.price < 500 || item.price > 999)) return false;
    if (band === '1000-plus' && item.price < 1000) return false;

    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.shortDescription.toLowerCase().includes(normalizedQuery) ||
      item.details.toLowerCase().includes(normalizedQuery)
    );
  });

  if (options.sortBy === 'price-asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (options.sortBy === 'price-desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }
  return filtered;
}

export function buildCartKey(
  productId: string,
  personalisation?: PersonalisationOptions
): string {
  if (!personalisation) return productId;
  const namePart = personalisation.customName.trim().toLowerCase();
  const notePart = personalisation.giftNote.trim().toLowerCase();
  return `${productId}::${personalisation.wrapStyle}::${namePart}::${notePart}`;
}

export function evaluatePromoCode(
  rawCode: string | undefined,
  merchandiseTotal: number
): { code: string; discount: number; valid: boolean; message: string } {
  const normalized = (rawCode ?? '').trim().toUpperCase();
  if (!normalized) {
    return { code: '', discount: 0, valid: false, message: '' };
  }
  const rule = PROMO_CODES[normalized];
  if (!rule) {
    return {
      code: '',
      discount: 0,
      valid: false,
      message: 'Invalid code. Try WISH5 or GIFT100.',
    };
  }
  if (merchandiseTotal < rule.minOrder) {
    return {
      code: '',
      discount: 0,
      valid: false,
      message: `${normalized} requires a minimum bag value of ${formatINR(rule.minOrder)}.`,
    };
  }
  const discount =
    rule.type === 'percent'
      ? Math.round((merchandiseTotal * rule.value) / 100)
      : Math.min(merchandiseTotal, rule.value);

  return {
    code: normalized,
    discount,
    valid: true,
    message: `${normalized} applied (${rule.label}).`,
  };
}

export function calculateCartTotals(
  items: CartItem[],
  options?: {
    fulfilment?: 'delivery' | 'pickup';
    promoCode?: string;
    freeDeliveryThreshold?: number;
    standardDeliveryFee?: number;
  }
): CartTotals {
  const freeThreshold =
    options?.freeDeliveryThreshold ?? FREE_DELIVERY_THRESHOLD;
  const standardFee = options?.standardDeliveryFee ?? STANDARD_DELIVERY_FEE;

  let itemCount = 0;
  let subtotal = 0;
  let personalisationTotal = 0;

  for (const item of items) {
    itemCount += item.quantity;
    subtotal += item.product.price * item.quantity;

    const hasCustomText = Boolean(
      item.personalisation &&
        (item.personalisation.customName.trim().length > 0 ||
          item.personalisation.giftNote.trim().length > 0)
    );
    if (hasCustomText && item.product.personalisationFee > 0) {
      personalisationTotal += item.product.personalisationFee * item.quantity;
    }
  }

  const merchandiseTotal = subtotal + personalisationTotal;
  const promoEval = evaluatePromoCode(options?.promoCode, merchandiseTotal);
  const promoCode = promoEval.valid ? promoEval.code : '';
  const promoDiscount = promoEval.valid ? promoEval.discount : 0;
  const netMerchandise = Math.max(0, merchandiseTotal - promoDiscount);

  const isPickup = options?.fulfilment === 'pickup';
  const deliveryFee =
    items.length === 0 || isPickup || netMerchandise >= freeThreshold
      ? 0
      : standardFee;

  const freeDeliveryRemaining =
    items.length === 0 || isPickup
      ? 0
      : Math.max(0, freeThreshold - netMerchandise);

  const total = netMerchandise + deliveryFee;
  const gstAmount =
    total > 0
      ? Math.round((total * GST_RATE_PERCENT) / (100 + GST_RATE_PERCENT))
      : 0;
  const cgstAmount = Math.floor(gstAmount / 2);
  const sgstAmount = gstAmount - cgstAmount;
  const taxableValue = Math.max(0, total - gstAmount);

  return {
    itemCount,
    subtotal,
    personalisationTotal,
    merchandiseTotal,
    promoCode,
    promoDiscount,
    deliveryFee,
    freeDeliveryRemaining,
    taxableValue,
    cgstAmount,
    sgstAmount,
    gstAmount,
    total,
  };
}

export function sanitizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function validateCheckoutForm(
  form: CheckoutForm
): Partial<Record<keyof CheckoutForm, string>> {
  const errors: Partial<Record<keyof CheckoutForm, string>> = {};
  if (form.customerName.trim().length < 2) {
    errors.customerName = 'Please enter billing / recipient full name.';
  }
  const phoneDigits = sanitizeIndianPhone(form.phone);
  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (form.email && form.email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address or leave blank.';
    }
  }
  if (form.gstin && form.gstin.trim().length > 0) {
    if (!/^[0-9A-Z]{15}$/i.test(form.gstin.trim())) {
      errors.gstin = 'GSTIN must be 15 alphanumeric characters (or leave blank).';
    }
  }
  if (form.fulfilment === 'delivery') {
    if (form.address.trim().length < 8) {
      errors.address = 'Please enter a complete street or house address.';
    }
    if (form.cityPincode.trim().length < 5) {
      errors.cityPincode = 'Enter your city across Haryana / India and PIN code.';
    }
  }
  return errors;
}

export function validateEnquiryForm(form: {
  customerName: string;
  phone: string;
  subject: string;
  message: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.customerName.trim().length < 2) {
    errors.customerName = 'Please enter your name.';
  }
  const digits = sanitizeIndianPhone(form.phone);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }
  if (form.subject.trim().length < 3) {
    errors.subject = 'Please specify a short topic.';
  }
  if (form.message.trim().length < 8) {
    errors.message = 'Tell us briefly what gift or budget you have in mind.';
  }
  return errors;
}

export function buildInvoiceText(order: OrderRecord): string {
  const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const lines: string[] = [
    'WISHMANTRA GIFT GALLERY',
    '#5, DC Road, Near Post Office, Sadar Bazaar, Ambala Cantt, Haryana',
    'Phone / WhatsApp: +91 89501-23188 | www.wishmantra.in',
    '--------------------------------------------------',
    `INVOICE / BILL NO: #${order.orderNumber}`,
    `DATE: ${dateStr}`,
    `CUSTOMER: ${order.customerName} (${order.phone})`,
    order.email ? `EMAIL: ${order.email}` : '',
    order.gstin ? `CUSTOMER GSTIN: ${order.gstin}` : '',
    `FULFILMENT: ${
      order.fulfilment === 'pickup'
        ? 'Store Pickup — Sadar Bazaar, Ambala Cantt'
        : `Home Delivery — ${order.address}, ${order.cityPincode}`
    }`,
    `PAYMENT MODE: ${
      order.paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : order.paymentMethod === 'upi'
          ? 'UPI Payment'
          : order.paymentMethod === 'whatsapp'
            ? 'WhatsApp / UPI Order'
            : 'Pay at Gallery Counter'
    }`,
    '--------------------------------------------------',
    'ITEMS:',
  ].filter(Boolean);

  for (const item of order.items) {
    const unitRate = item.unitPrice + item.personalisationFee;
    const lineAmt = unitRate * item.quantity;
    lines.push(
      `- ${item.name} (${item.quantity} x ${formatINR(unitRate)}) = ${formatINR(lineAmt)}`
    );
    if (item.personalisation?.wrapStyle) {
      lines.push(`  Wrap: ${item.personalisation.wrapStyle}`);
    }
    if (item.personalisation?.customName) {
      lines.push(`  Engraving: "${item.personalisation.customName}"`);
    }
    if (item.personalisation?.giftNote) {
      lines.push(`  Note: "${item.personalisation.giftNote}"`);
    }
  }

  lines.push('--------------------------------------------------');
  lines.push(`Item Subtotal: ${formatINR(order.subtotal)}`);
  if (order.personalisationTotal > 0) {
    lines.push(`Personalisation: +${formatINR(order.personalisationTotal)}`);
  }
  if (order.promoDiscount > 0) {
    lines.push(
      `Promo (${order.promoCode || 'DISCOUNT'}): -${formatINR(order.promoDiscount)}`
    );
  }
  lines.push(
    `Delivery Charges: ${order.deliveryFee === 0 ? 'Free' : formatINR(order.deliveryFee)}`
  );
  lines.push(`Taxable Value: ${formatINR(order.taxableValue)}`);
  lines.push(`GST (${GST_RATE_PERCENT}% incl.): ${formatINR(order.gstAmount)}`);
  lines.push(`GRAND TOTAL: ${formatINR(order.totalAmount)}`);
  lines.push('--------------------------------------------------');
  lines.push('Thank you for gifting with WishMantra!');

  return lines.join('\n');
}

export function normalizeWhatsAppPhone(rawPhone?: string): string {
  const digits = (rawPhone ?? '').replace(/\D/g, '');
  if (!digits) return WHATSAPP_NUMBER_INTL;
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits.length >= 10 ? digits : WHATSAPP_NUMBER_INTL;
}

export function buildWhatsAppUrl(message: string, phone?: string): string {
  const intlPhone = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppProductOrderText(
  product: Product,
  quantity: number,
  personalisation?: PersonalisationOptions,
  storeName = 'WishMantra'
): string {
  const qty = Math.max(1, Math.floor(quantity));
  const hasCustom = Boolean(
    personalisation &&
      (personalisation.customName.trim().length > 0 ||
        personalisation.giftNote.trim().length > 0)
  );
  const customFee = hasCustom ? product.personalisationFee : 0;
  const unitPrice = product.price + customFee;
  const lineTotal = unitPrice * qty;

  const lines = [
    `*New Order via ${storeName} Website*`,
    `Product: ${product.name}`,
    `Category: ${product.category}`,
    `Quantity: ${qty} x ${formatINR(product.price)}`,
  ];
  if (personalisation?.wrapStyle) {
    lines.push(`Wrap Finish: ${personalisation.wrapStyle}`);
  }
  if (personalisation?.customName.trim()) {
    lines.push(`Engraving / Name: "${personalisation.customName.trim()}" (+${formatINR(customFee)}/item)`);
  }
  if (personalisation?.giftNote.trim()) {
    lines.push(`Gift Card Message: "${personalisation.giftNote.trim()}"`);
  }
  lines.push(`Estimated Total: *${formatINR(lineTotal)}* (excl. delivery if under threshold)`);
  lines.push('Please confirm stock & payment / delivery details.');
  return lines.join('\n');
}

export function buildWhatsAppCartOrderText(
  items: CartItem[],
  totals: CartTotals,
  options?: {
    fulfilment?: 'delivery' | 'pickup';
    customerName?: string;
    phone?: string;
    address?: string;
    cityPincode?: string;
    storeName?: string;
  }
): string {
  const storeName = options?.storeName || 'WishMantra';
  const lines: string[] = [
    `*New Order Request — ${storeName}*`,
    '----------------------------------',
    `Fulfilment: ${options?.fulfilment === 'pickup' ? 'Ambala Store Pickup (Free)' : 'Home Delivery'}`,
  ];

  if (options?.customerName?.trim()) {
    lines.push(`Customer: ${options.customerName.trim()}`);
  }
  if (options?.phone?.trim()) {
    lines.push(`Mobile: ${options.phone.trim()}`);
  }
  if (options?.fulfilment !== 'pickup' && (options?.address?.trim() || options?.cityPincode?.trim())) {
    lines.push(`Address: ${[options?.address?.trim(), options?.cityPincode?.trim()].filter(Boolean).join(', ')}`);
  }

  lines.push('----------------------------------');
  lines.push('*ITEMS:*');
  for (const item of items) {
    const hasCustom = Boolean(
      item.personalisation &&
        (item.personalisation.customName.trim().length > 0 ||
          item.personalisation.giftNote.trim().length > 0)
    );
    const customFee = hasCustom ? item.product.personalisationFee : 0;
    const unitRate = item.product.price + customFee;
    lines.push(
      `• ${item.product.name} (${item.quantity} x ${formatINR(unitRate)}) = ${formatINR(unitRate * item.quantity)}`
    );
    if (item.personalisation?.wrapStyle) {
      lines.push(`  Wrap: ${item.personalisation.wrapStyle}`);
    }
    if (item.personalisation?.customName.trim()) {
      lines.push(`  Engraving: "${item.personalisation.customName.trim()}"`);
    }
    if (item.personalisation?.giftNote.trim()) {
      lines.push(`  Gift Note: "${item.personalisation.giftNote.trim()}"`);
    }
  }

  lines.push('----------------------------------');
  lines.push(`Item Subtotal: ${formatINR(totals.subtotal)}`);
  if (totals.personalisationTotal > 0) {
    lines.push(`Personalisation: +${formatINR(totals.personalisationTotal)}`);
  }
  if (totals.promoDiscount > 0) {
    lines.push(`Promo (${totals.promoCode}): -${formatINR(totals.promoDiscount)}`);
  }
  lines.push(
    `Delivery: ${totals.deliveryFee === 0 ? 'Free' : formatINR(totals.deliveryFee)}`
  );
  lines.push(`GST (${GST_RATE_PERCENT}% incl.): ${formatINR(totals.gstAmount)}`);
  lines.push(`*GRAND TOTAL: ${formatINR(totals.total)}*`);
  lines.push('----------------------------------');
  lines.push('Please confirm this order and share UPI / dispatch timing.');
  return lines.join('\n');
}

export function buildWhatsAppCustomerUpdateText(
  order: OrderRecord,
  storeName = 'WishMantra'
): string {
  const fulfilmentText =
    order.fulfilment === 'pickup'
      ? 'Sadar Bazaar Store Pickup (Ambala Cantt)'
      : `Delivery to ${order.cityPincode}`;
  return [
    `Hi ${order.customerName},`,
    `Update from *${storeName}* regarding your order *#${order.orderNumber}* (${formatINR(order.totalAmount)}):`,
    `Status: *${order.status}*`,
    `Fulfilment: ${fulfilmentText}`,
    '',
    'Thank you for gifting with WishMantra! Reply here for any questions.',
  ].join('\n');
}

