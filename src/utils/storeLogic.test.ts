import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCartKey,
  buildInvoiceText,
  buildWhatsAppCartOrderText,
  buildWhatsAppCustomerUpdateText,
  buildWhatsAppProductOrderText,
  buildWhatsAppUrl,
  calculateCartTotals,
  evaluatePromoCode,
  filterAndSortProducts,
  formatINR,
  normalizeWhatsAppPhone,
  sanitizeIndianPhone,
  validateCheckoutForm,
  validateEnquiryForm,
  type OrderRecord,
  type Product,
} from './storeLogic.ts';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Engraved Walnut Keepsake Box',
    category: 'Customised Gifts',
    price: 1299,
    unitLabel: 'per set',
    shortDescription: 'Monogrammed wooden gift box',
    details: 'Laser engraved lid with soy candle.',
    customisable: true,
    personalisationFee: 150,
    rating: 4.9,
    reviewCount: 42,
    image: '/test.jpg',
    imageAlt: 'Keepsake box',
  },
  {
    id: 'p2',
    name: 'Tactile Mechanical Gaming Combo',
    category: 'Gaming',
    price: 3499,
    unitLabel: 'per kit',
    shortDescription: '65% keyboard and wireless controller',
    details: 'Plum and cream PBT keycaps.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.8,
    reviewCount: 28,
    image: '/test2.jpg',
    imageAlt: 'Gaming combo',
  },
  {
    id: 'p3',
    name: 'Sage Botanical Stationery Folio',
    category: 'Stationery',
    price: 449,
    unitLabel: 'per set',
    shortDescription: 'Embossed journal and fountain pens',
    details: 'Includes wax seal stamp.',
    customisable: true,
    personalisationFee: 50,
    rating: 4.9,
    reviewCount: 64,
    image: '/test3.jpg',
    imageAlt: 'Stationery set',
  },
];

test('formatINR formats Indian currency without decimals', () => {
  assert.equal(formatINR(1299), '₹1,299');
  assert.equal(formatINR(125000), '₹1,25,000');
});

test('filterAndSortProducts filters by category, priceBand, search query, and sorts price', () => {
  const gaming = filterAndSortProducts(SAMPLE_PRODUCTS, {
    category: 'Gaming',
    query: '',
    sortBy: 'featured',
  });
  assert.equal(gaming.length, 1);
  assert.equal(gaming[0].id, 'p2');

  const under499 = filterAndSortProducts(SAMPLE_PRODUCTS, {
    category: 'All',
    query: '',
    sortBy: 'featured',
    priceBand: 'under-499',
  });
  assert.equal(under499.length, 1);
  assert.equal(under499[0].id, 'p3');

  const queryMatch = filterAndSortProducts(SAMPLE_PRODUCTS, {
    category: 'All',
    query: 'wax seal',
    sortBy: 'featured',
  });
  assert.equal(queryMatch.length, 1);
  assert.equal(queryMatch[0].id, 'p3');

  const sortedAsc = filterAndSortProducts(SAMPLE_PRODUCTS, {
    category: 'All',
    query: '',
    sortBy: 'price-asc',
  });
  assert.deepEqual(
    sortedAsc.map((p) => p.id),
    ['p3', 'p1', 'p2']
  );
});

test('calculateCartTotals computes personalisation, ₹999 delivery threshold, promo codes, and GST split', () => {
  const emptyTotals = calculateCartTotals([]);
  assert.equal(emptyTotals.total, 0);
  assert.equal(emptyTotals.deliveryFee, 0);
  assert.equal(emptyTotals.gstAmount, 0);

  // Budget item below ₹999 threshold: 449 + 50 = 499 + ₹59 delivery = ₹558
  const budgetCustomItem = [
    {
      cartKey: buildCartKey('p3', {
        customName: 'Riya',
        giftNote: '',
        wrapStyle: 'Blush Silk & Kraft' as const,
      }),
      product: SAMPLE_PRODUCTS[2],
      quantity: 1,
      personalisation: {
        customName: 'Riya',
        giftNote: '',
        wrapStyle: 'Blush Silk & Kraft' as const,
      },
    },
  ];
  const deliveryBill = calculateCartTotals(budgetCustomItem, {
    fulfilment: 'delivery',
  });
  assert.equal(deliveryBill.subtotal, 449);
  assert.equal(deliveryBill.personalisationTotal, 50);
  assert.equal(deliveryBill.deliveryFee, 59);
  assert.equal(deliveryBill.total, 558);
  assert.equal(deliveryBill.freeDeliveryRemaining, 500);
  assert.equal(
    deliveryBill.taxableValue + deliveryBill.gstAmount,
    deliveryBill.total
  );
  assert.equal(
    deliveryBill.cgstAmount + deliveryBill.sgstAmount,
    deliveryBill.gstAmount
  );

  // Higher order above ₹999 gets free delivery + WISH5 (5% of 1449 = 72)
  const premiumCustomItem = [
    {
      cartKey: buildCartKey('p1', {
        customName: 'Aarav',
        giftNote: '',
        wrapStyle: 'Blush Silk & Kraft' as const,
      }),
      product: SAMPLE_PRODUCTS[0],
      quantity: 1,
      personalisation: {
        customName: 'Aarav',
        giftNote: '',
        wrapStyle: 'Blush Silk & Kraft' as const,
      },
    },
  ];
  const freeDeliveryWithPromo = calculateCartTotals(premiumCustomItem, {
    fulfilment: 'delivery',
    promoCode: 'wish5',
  });
  assert.equal(freeDeliveryWithPromo.deliveryFee, 0);
  assert.equal(freeDeliveryWithPromo.promoCode, 'WISH5');
  assert.equal(freeDeliveryWithPromo.promoDiscount, 72);
  assert.equal(freeDeliveryWithPromo.total, 1377);
  assert.equal(freeDeliveryWithPromo.freeDeliveryRemaining, 0);
});

test('evaluatePromoCode validates WISH5, GIFT100, minimum spend, and invalid codes', () => {
  const invalid = evaluatePromoCode('NOPE', 2000);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.discount, 0);

  const belowMin = evaluatePromoCode('GIFT100', 1200);
  assert.equal(belowMin.valid, false);

  const validFlat = evaluatePromoCode('gift100', 2000);
  assert.equal(validFlat.valid, true);
  assert.equal(validFlat.code, 'GIFT100');
  assert.equal(validFlat.discount, 100);
});

test('phone sanitization, checkout validation, and enquiry validation work cleanly', () => {
  assert.equal(sanitizeIndianPhone('+91 89501-23188'), '8950123188');

  const invalidCheckout = validateCheckoutForm({
    customerName: 'A',
    phone: '12345',
    email: 'bad-email',
    gstin: 'SHORT',
    fulfilment: 'delivery',
    address: 'abc',
    cityPincode: '13',
    paymentMethod: 'cod',
  });
  assert.ok(invalidCheckout.customerName);
  assert.ok(invalidCheckout.phone);
  assert.ok(invalidCheckout.email);
  assert.ok(invalidCheckout.gstin);
  assert.ok(invalidCheckout.address);
  assert.ok(invalidCheckout.cityPincode);

  const validPickup = validateCheckoutForm({
    customerName: 'Riya Sharma',
    phone: '8950123188',
    email: 'riya@example.in',
    gstin: '06ABCDE1234F1Z5',
    fulfilment: 'pickup',
    address: '',
    cityPincode: '',
    paymentMethod: 'store',
  });
  assert.deepEqual(validPickup, {});

  const badEnquiry = validateEnquiryForm({
    customerName: 'A',
    phone: '123',
    subject: 'Hi',
    message: 'Short',
  });
  assert.ok(badEnquiry.customerName);
  assert.ok(badEnquiry.phone);
  assert.ok(badEnquiry.subject);
  assert.ok(badEnquiry.message);

  const goodEnquiry = validateEnquiryForm({
    customerName: 'Meera Gill',
    phone: '9812345678',
    subject: 'Return gifts quote',
    message: 'Need 20 scented candle boxes under ₹300 each.',
  });
  assert.deepEqual(goodEnquiry, {});
});

test('buildInvoiceText formats itemized tax invoice cleanly', () => {
  const sampleOrder: OrderRecord = {
    id: 1,
    orderNumber: 'WM-5123',
    customerName: 'Riya Sharma',
    phone: '8950123188',
    email: 'riya@example.in',
    gstin: '06ABCDE1234F1Z5',
    fulfilment: 'pickup',
    address: 'Sadar Bazaar Gallery Pickup',
    cityPincode: 'Ambala Cantt, 133001',
    paymentMethod: 'store',
    items: [
      {
        productId: 'p1',
        name: 'Engraved Walnut Keepsake Box',
        quantity: 1,
        unitPrice: 1299,
        personalisationFee: 150,
        personalisation: {
          customName: 'Riya',
          giftNote: 'Happy Birthday',
          wrapStyle: 'Blush Silk & Kraft',
        },
      },
    ],
    subtotal: 1299,
    personalisationTotal: 150,
    promoCode: 'WISH5',
    promoDiscount: 72,
    deliveryFee: 0,
    taxableValue: 1229,
    gstAmount: 148,
    totalAmount: 1377,
    status: 'Pending',
    adminNotes: '',
    createdAt: '2026-11-15T10:00:00.000Z',
  };

  const text = buildInvoiceText(sampleOrder);
  assert.ok(text.includes('INVOICE / BILL NO: #WM-5123'));
  assert.ok(text.includes('CUSTOMER GSTIN: 06ABCDE1234F1Z5'));
  assert.ok(text.includes('Promo (WISH5): -₹72'));
  assert.ok(text.includes('GRAND TOTAL: ₹1,377'));
});

test('buildWhatsAppUrl encodes text cleanly for default and custom gallery numbers', () => {
  const url = buildWhatsAppUrl('Hello WishMantra!');
  assert.equal(url, 'https://wa.me/918950123188?text=Hello%20WishMantra!');

  assert.equal(normalizeWhatsAppPhone('98130-12345'), '919813012345');
  assert.equal(normalizeWhatsAppPhone('+91 89501-23188'), '918950123188');
  assert.equal(normalizeWhatsAppPhone('09813012345'), '919813012345');
  const customUrl = buildWhatsAppUrl('Order Update', '9813012345');
  assert.equal(customUrl, 'https://wa.me/919813012345?text=Order%20Update');
});

test('WhatsApp product, cart, and customer update formatters include complete order details', () => {
  const productMsg = buildWhatsAppProductOrderText(
    SAMPLE_PRODUCTS[2],
    2,
    {
      customName: 'Simran',
      giftNote: 'Happy Birthday!',
      wrapStyle: 'Blush Silk & Kraft',
    },
    'WishMantra'
  );
  assert.ok(productMsg.includes('Sage Botanical Stationery Folio'));
  assert.ok(productMsg.includes('Engraving / Name: "Simran"'));
  assert.ok(productMsg.includes('Estimated Total: *₹998*'));

  const items = [
    {
      cartKey: 'p3',
      product: SAMPLE_PRODUCTS[2],
      quantity: 1,
      personalisation: {
        customName: 'Aarav',
        giftNote: '',
        wrapStyle: 'Blush Silk & Kraft' as const,
      },
    },
  ];
  const totals = calculateCartTotals(items, { fulfilment: 'delivery' });
  const cartMsg = buildWhatsAppCartOrderText(items, totals, {
    fulfilment: 'delivery',
    customerName: 'Neha',
    cityPincode: 'Karnal, 132001',
  });
  assert.ok(cartMsg.includes('Home Delivery'));
  assert.ok(cartMsg.includes('Customer: Neha'));
  assert.ok(cartMsg.includes('*GRAND TOTAL: ₹558*'));

  const updateMsg = buildWhatsAppCustomerUpdateText({
    id: 1,
    orderNumber: 'WM-7001',
    customerName: 'Priya',
    phone: '9812345678',
    email: '',
    gstin: '',
    fulfilment: 'pickup',
    address: 'Sadar Bazaar',
    cityPincode: 'Ambala Cantt, 133001',
    paymentMethod: 'whatsapp',
    items: [],
    subtotal: 449,
    personalisationTotal: 0,
    promoCode: '',
    promoDiscount: 0,
    deliveryFee: 0,
    taxableValue: 401,
    gstAmount: 48,
    totalAmount: 449,
    status: 'Ready for Pickup',
    adminNotes: '',
    createdAt: '2026-11-18T09:00:00.000Z',
  });
  assert.ok(updateMsg.includes('#WM-7001'));
  assert.ok(updateMsg.includes('*Ready for Pickup*'));
});

