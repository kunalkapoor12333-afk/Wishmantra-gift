import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminToken,
  hashPasscode,
  verifyAdminToken,
  verifyPasscodeHash,
} from './auth.ts';
import { StoreDatabase } from './db.ts';

test('admin token creation and verification works and rejects tampering', () => {
  const token = createAdminToken();
  assert.equal(verifyAdminToken(token), true);
  assert.equal(verifyAdminToken(`${token}tampered`), false);
  assert.equal(verifyAdminToken('invalid'), false);
  assert.equal(verifyAdminToken(null), false);
});

test('scrypt passcode hashing and atomic claim work properly', () => {
  const hash = hashPasscode('secure-studio-pass');
  assert.equal(verifyPasscodeHash('secure-studio-pass', hash), true);
  assert.equal(verifyPasscodeHash('wrong-pass', hash), false);

  const db = new StoreDatabase(':memory:');
  assert.equal(db.getAdminPasscodeHash(), null);
  assert.equal(db.claimAdminPasscodeHash(hash), true);
  assert.equal(db.claimAdminPasscodeHash('overwrite-attempt'), false);
  assert.equal(db.getAdminPasscodeHash(), hash);
});

test('SQLite database saves records permanently to disk across reopen', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wishmantra-db-'));
  const dbFile = path.join(tmpDir, 'test.db');
  try {
    const db1 = new StoreDatabase(dbFile);
    const created = db1.createEnquiry({
      customerName: 'Persisted Tester',
      phone: '9876543210',
      city: 'Ambala',
      subject: 'Persistence verification',
      message: 'Confirming disk write survives reopen.',
    });
    db1.db.close();

    const db2 = new StoreDatabase(dbFile);
    const enquiries = db2.listEnquiries();
    assert.ok(enquiries.some((e) => e.id === created.id && e.customerName === 'Persisted Tester'));
    db2.db.close();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('StoreDatabase seeds 30 Haryana-friendly products, 5 orders, categories, enquiries, and full KPI summary', () => {
  const db = new StoreDatabase(':memory:');
  const products = db.listProducts(true);
  assert.equal(products.length, 30);
  assert.ok(products.some((p) => p.price <= 199));

  const orders = db.listOrders();
  assert.equal(orders.length, 5);

  const summary = db.getDashboardSummary();
  assert.equal(summary.totalProducts, 30);
  assert.equal(summary.activeProducts, 30);
  assert.equal(summary.totalOrders, 5);
  assert.ok(summary.totalCustomers >= 4);
  assert.ok(summary.pendingOrders >= 2);
  assert.ok(summary.lowStockProducts >= 3);
  assert.ok(summary.totalRevenue > 0);

  const bestSellers = db.getBestSellingProducts(5);
  assert.ok(bestSellers.length > 0);
  const series = db.getSalesOverview(7);
  assert.equal(series.length, 7);
});

test('StoreDatabase supports product stock updates, categories CRUD, enquiries, and site settings', () => {
  const db = new StoreDatabase(':memory:');
  const created = db.createProduct({
    name: 'Crystal Nameplate Desk Trophy',
    category: 'Customised Gifts',
    price: 599,
    unitLabel: 'per piece',
    shortDescription: 'Engraved glass desk trophy',
    details: 'Custom laser engraved gift.',
    customisable: true,
    personalisationFee: 80,
    imageKey: 'product_custom_hamper',
    imageAlt: 'Crystal nameplate',
    highlight: 'New Arrival',
    inStock: true,
    stockQty: 4,
    lowStockThreshold: 5,
  });

  assert.ok(created.id.startsWith('wm-crystal-nameplate'));
  assert.equal(created.stockQty, 4);
  assert.equal(db.listProducts(false).length, 31);

  const updated = db.updateProduct(created.id, { price: 649, stockQty: 20 });
  assert.equal(updated?.price, 649);
  assert.equal(updated?.stockQty, 20);
  assert.equal(db.deleteProduct(created.id), true);

  const newCat = db.createCategory({
    name: 'Festive Combos',
    description: 'Diwali and Rakhi hampers',
  });
  assert.equal(newCat.name, 'Festive Combos');
  assert.equal(db.deleteCategory(newCat.id), true);

  const enq = db.createEnquiry({
    customerName: 'Kavita Rani',
    phone: '9812011223',
    city: 'Karnal',
    subject: 'Birthday favours',
    message: 'Need 15 rose candle boxes under ₹299 each.',
  });
  assert.equal(enq.status, 'Open');
  const updatedEnq = db.updateEnquiryStatus(
    enq.id,
    'Replied',
    'Shared quote on WhatsApp.'
  );
  assert.equal(updatedEnq?.status, 'Replied');
  assert.equal(updatedEnq?.adminReply, 'Shared quote on WhatsApp.');

  const savedSettings = db.updateSiteSettings({
    freeDeliveryThreshold: 799,
    standardDeliveryFee: 49,
  });
  assert.equal(savedSettings.freeDeliveryThreshold, 799);
  assert.equal(savedSettings.standardDeliveryFee, 49);
});

test('StoreDatabase computes authoritative order billing with ₹999 threshold, promo, GST, and stock deduction', () => {
  const db = new StoreDatabase(':memory:');
  const beforeProduct = db.getProductById('wm-blush-ceramic-mug')!;
  const deliveryOrder = db.createOrder({
    form: {
      customerName: 'Karan Mehta',
      phone: '9876543210',
      email: 'karan@example.in',
      gstin: '06ABCDE1234F1Z5',
      fulfilment: 'delivery',
      address: '22 Nicholson Road',
      cityPincode: 'Ambala Cantt, 133001',
      paymentMethod: 'cod',
    },
    items: [
      {
        productId: 'wm-blush-ceramic-mug',
        quantity: 1,
        personalisation: {
          customName: 'Karan',
          giftNote: 'Happy Birthday',
          wrapStyle: 'Blush Silk & Kraft',
        },
      },
    ],
  });

  // 399 + 40 personalisation + 59 delivery (< 999) = 498
  assert.equal(deliveryOrder.totalAmount, 498);
  assert.equal(deliveryOrder.deliveryFee, 59);
  assert.equal(deliveryOrder.taxableValue + deliveryOrder.gstAmount, 498);
  const afterProduct = db.getProductById('wm-blush-ceramic-mug')!;
  assert.equal(afterProduct.stockQty, (beforeProduct.stockQty ?? 0) - 1);

  const freeDeliveryPickup = db.createOrder({
    form: {
      customerName: 'Pooja Arora',
      phone: '9812345678',
      fulfilment: 'pickup',
      address: '',
      cityPincode: '',
      paymentMethod: 'store',
      promoCode: 'wish5',
    },
    items: [
      {
        productId: 'wm-walnut-keepsake',
        quantity: 1,
      },
    ],
  });
  // 1499 - 5% (75) + 0 pickup = 1424
  assert.equal(freeDeliveryPickup.promoCode, 'WISH5');
  assert.equal(freeDeliveryPickup.promoDiscount, 75);
  assert.equal(freeDeliveryPickup.deliveryFee, 0);
  assert.equal(freeDeliveryPickup.totalAmount, 1424);
});
