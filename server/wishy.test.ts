import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWishyCatalogContext,
  extractWishyHistory,
  formatGeminiApiError,
  parseWishyResponse,
} from './wishy.ts';
import type { Product, SiteSettings } from '../src/utils/storeLogic.ts';

const MOCK_SETTINGS: SiteSettings = {
  storeName: 'WishMantra',
  announcementText: 'Starting ₹149',
  freeDeliveryThreshold: 999,
  standardDeliveryFee: 59,
  phoneDisplay: '+91 89501-23188',
  address: '#5, DC Road, Ambala Cantt',
  hours: '10:30 AM – 8:30 PM',
  promoCodesEnabled: true,
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'wm-mug',
    name: 'Blush Matte Monogram Mug',
    category: 'Customised Gifts',
    price: 399,
    unitLabel: 'per set',
    shortDescription: 'Personalised blush mug with coaster',
    details: 'Dishwasher safe.',
    customisable: true,
    personalisationFee: 40,
    rating: 4.9,
    reviewCount: 50,
    image: '/mug.jpg',
    imageAlt: 'Mug',
    inStock: true,
    stockQty: 12,
  },
  {
    id: 'wm-oos',
    name: 'Sold Out Item',
    category: 'Gaming',
    price: 999,
    unitLabel: 'per kit',
    shortDescription: 'Temporarily out of stock',
    details: 'Out of stock.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.5,
    reviewCount: 4,
    image: '/oos.jpg',
    imageAlt: 'OOS',
    inStock: false,
    stockQty: 0,
  },
];

test('buildWishyCatalogContext excludes out-of-stock products and includes store rules', () => {
  const ctx = buildWishyCatalogContext(MOCK_PRODUCTS, MOCK_SETTINGS);
  assert.ok(ctx.includes('id="wm-mug"'));
  assert.ok(!ctx.includes('id="wm-oos"'));
  assert.ok(ctx.includes('₹999'));
  assert.ok(ctx.includes('WISH5'));
});

test('extractWishyHistory keeps valid turns and caps length', () => {
  const turns = extractWishyHistory([
    { role: 'user', text: '  Gifts under 500  ' },
    { role: 'system', text: 'ignored' },
    { role: 'assistant', text: '' },
    { role: 'assistant', text: 'Try the Blush Mug!' },
  ]);
  assert.equal(turns.length, 2);
  assert.deepEqual(turns[0], { role: 'user', text: 'Gifts under 500' });
  assert.deepEqual(turns[1], { role: 'assistant', text: 'Try the Blush Mug!' });
});

test('parseWishyResponse filters invalid product IDs and normalizes JSON', () => {
  const result = parseWishyResponse(
    JSON.stringify({
      reply: 'The Blush Matte Monogram Mug is a great ₹399 pick!',
      recommendedProductIds: ['wm-mug', 'wm-oos', 'non-existent'],
      followUpPrompts: ['Under ₹299', 'Add engraving', 'Show hampers', 'Extra prompt'],
    }),
    MOCK_PRODUCTS
  );

  assert.equal(result.reply, 'The Blush Matte Monogram Mug is a great ₹399 pick!');
  assert.deepEqual(result.recommendedProductIds, ['wm-mug']);
  assert.deepEqual(result.followUpPrompts, ['Under ₹299', 'Add engraving', 'Show hampers']);
});

test('formatGeminiApiError returns user-friendly message for JSON-wrapped 503 UNAVAILABLE errors', () => {
  const formatted = formatGeminiApiError(
    new Error(
      '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'
    )
  );
  assert.equal(formatted.status, 503);
  assert.ok(!formatted.message.includes('{'));
  assert.ok(formatted.message.toLowerCase().includes('high demand'));
});
