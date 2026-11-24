import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  calculateCartTotals,
  ENQUIRY_STATUSES,
  FREE_DELIVERY_THRESHOLD,
  ORDER_STATUSES,
  STANDARD_DELIVERY_FEE,
  type AdminDashboardSummary,
  type BestSellerStat,
  type CartItem,
  type CategoryRecord,
  type CheckoutForm,
  type CustomerSummary,
  type EnquiryRecord,
  type EnquiryStatus,
  type ImageKey,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatus,
  type PersonalisationOptions,
  type Product,
  type SalesDayPoint,
  type SiteSettings,
} from '../src/utils/storeLogic.ts';

export interface DbProductInput {
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

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  unit_label: string;
  short_description: string;
  details: string;
  customisable: number;
  personalisation_fee: number;
  rating: number;
  review_count: number;
  image_key: string;
  image_alt: string;
  highlight: string | null;
  in_stock: number;
  stock_qty: number;
  low_stock_threshold: number;
  sort_order: number;
  created_at: string;
}

interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  gstin: string;
  fulfilment: string;
  address: string;
  city_pincode: string;
  payment_method: string;
  items_json: string;
  subtotal: number;
  personalisation_total: number;
  promo_code: string;
  promo_discount: number;
  delivery_fee: number;
  taxable_value: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  admin_notes: string;
  created_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
}

interface EnquiryRow {
  id: number;
  customer_name: string;
  phone: string;
  city: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string;
  created_at: string;
}

const DEFAULT_CATEGORIES: Array<{ id: string; name: string; description: string; sortOrder: number }> = [
  {
    id: 'cat-customised',
    name: 'Customised Gifts',
    description: 'Engraved keepsakes, mugs, photo frames & memory albums.',
    sortOrder: 1,
  },
  {
    id: 'cat-stationery',
    name: 'Stationery',
    description: 'Pastel journals, gel pens, desk trays & wax-seal sets.',
    sortOrder: 2,
  },
  {
    id: 'cat-gaming',
    name: 'Gaming',
    description: 'Mechanical keyboards, headsets, desk mats & controllers.',
    sortOrder: 3,
  },
  {
    id: 'cat-return',
    name: 'Return Gifts',
    description: 'Cost-efficient wedding, birthday & festive favours.',
    sortOrder: 4,
  },
  {
    id: 'cat-hampers',
    name: 'Celebration Hampers',
    description: 'Ribboned gift boxes, self-care spa kits & truffle hampers.',
    sortOrder: 5,
  },
];

const DEFAULT_SETTINGS: SiteSettings = {
  storeName: 'WishMantra',
  announcementText:
    'Thoughtful gifts starting ₹149 · Ambala Cantt & Haryana dispatch · Free delivery above ₹999',
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  standardDeliveryFee: STANDARD_DELIVERY_FEE,
  phoneDisplay: '+91 89501-23188',
  address: '#5, DC Road, Near Post Office, Sadar Bazaar, Ambala Cantt',
  hours: 'Mon – Sun · 10:30 AM – 8:30 PM',
  promoCodesEnabled: true,
};

const SEED_PRODUCTS: Array<
  DbProductInput & {
    id: string;
    rating: number;
    reviewCount: number;
    sortOrder: number;
    stockQty: number;
    lowStockThreshold: number;
  }
> = [
  {
    id: 'wm-walnut-keepsake',
    name: 'Engraved Walnut Keepsake Box',
    category: 'Customised Gifts',
    price: 1499,
    unitLabel: 'per set',
    shortDescription:
      'Laser-engraved walnut chest with monogrammed matte tumbler, amber soy candle & brass pen.',
    details:
      'Crafted for anniversaries, weddings, and milestone birthdays. Personalise the walnut lid with names and date, paired with an insulated matte tumbler and hand-poured amber & oak candle.',
    customisable: true,
    personalisationFee: 150,
    rating: 4.9,
    reviewCount: 84,
    imageKey: 'product_custom_hamper',
    imageAlt: 'Engraved walnut keepsake box with monogrammed tumbler and soy candle',
    highlight: 'Best Seller',
    inStock: true,
    stockQty: 14,
    lowStockThreshold: 5,
    sortOrder: 1,
  },
  {
    id: 'wm-sage-folio',
    name: 'Botanical Hardcover Stationery Folio',
    category: 'Stationery',
    price: 899,
    unitLabel: 'per set',
    shortDescription:
      'Embossed sage linen journal, pastel fountain pens, brass clips & botanical wax seal kit.',
    details:
      '192 acid-free cream pages wrapped in textured botanical fabric, accompanied by two fine-nib pastel pens, solid brass clips, and a hand-turned walnut wax seal stamp.',
    customisable: true,
    personalisationFee: 100,
    rating: 4.9,
    reviewCount: 61,
    imageKey: 'product_stationery_set',
    imageAlt: 'Botanical hardcover journal with pastel fountain pens and wax seal stamp',
    highlight: 'Curated Set',
    inStock: true,
    stockQty: 18,
    lowStockThreshold: 5,
    sortOrder: 2,
  },
  {
    id: 'wm-pro-gaming-desk',
    name: 'Compact Mechanical Gaming Combo',
    category: 'Gaming',
    price: 3899,
    unitLabel: 'per combo',
    shortDescription:
      '65% hot-swappable mechanical keyboard with plum-cream keycaps & wireless dual-mode controller.',
    details:
      'Built for crisp tactile response on desk or console. Includes custom double-shot PBT keycaps, low-latency wireless gamepad, and braided Type-C charging cable in gift-ready packaging.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.8,
    reviewCount: 39,
    imageKey: 'product_gaming_desk',
    imageAlt:
      'Compact mechanical keyboard with cream and plum keycaps next to wireless controller',
    highlight: 'Gamer Pick',
    inStock: true,
    stockQty: 7,
    lowStockThreshold: 5,
    sortOrder: 3,
  },
  {
    id: 'wm-satin-return-favours',
    name: 'Satin Ribbon Return Gift Box',
    category: 'Return Gifts',
    price: 249,
    unitLabel: 'per box',
    shortDescription:
      'Boutique kraft box with blush rose or sage satin ribbon, mini jar candle & custom thank-you tag.',
    details:
      'Designed for weddings, baby showers, housewarmings, and milestone birthdays across Haryana. Includes a hand-poured sandalwood & rose jar candle and custom printed host tag.',
    customisable: true,
    personalisationFee: 25,
    rating: 4.9,
    reviewCount: 112,
    imageKey: 'product_return_gifts',
    imageAlt:
      'Boutique return gift favour boxes tied with dusty rose and sage satin ribbons',
    highlight: 'Value Pick',
    inStock: true,
    stockQty: 42,
    lowStockThreshold: 10,
    sortOrder: 4,
  },
  {
    id: 'wm-celebration-hamper',
    name: 'Grand Celebration Wicker Hamper',
    category: 'Celebration Hampers',
    price: 2499,
    unitLabel: 'per hamper',
    shortDescription:
      'Woven keepsake basket with artisanal truffles, gold-rimmed mug, dried bouquet & celebration card.',
    details:
      'Our signature festive and celebration gifting hamper. Hand-packed at our Sadar Bazaar gallery with gourmet cocoa truffles, heirloom mug, preserved botanicals, and blush satin bow.',
    customisable: true,
    personalisationFee: 120,
    rating: 5.0,
    reviewCount: 53,
    imageKey: 'product_celebration_box',
    imageAlt:
      'Open wicker celebration hamper with chocolates, gold-rimmed mug, and dried flowers',
    highlight: 'Signature Hamper',
    inStock: true,
    stockQty: 8,
    lowStockThreshold: 5,
    sortOrder: 5,
  },
  {
    id: 'wm-desk-ritual-pack',
    name: 'Signature Ribboned Journal & Mug Pair',
    category: 'Customised Gifts',
    price: 949,
    unitLabel: 'per pair',
    shortDescription:
      'Linen-bound ruled journal paired with stoneware ceramic mug and blush ribbon wrap.',
    details:
      'A thoughtful everyday gift for teachers, colleagues, and best friends. Add a name foil-stamped on the journal belly band and a handwritten calligraphy card inside.',
    customisable: true,
    personalisationFee: 80,
    rating: 4.8,
    reviewCount: 47,
    imageKey: 'hero_gift_gallery',
    imageAlt: 'Linen hardcover journal beside ceramic mug and ribboned gift box',
    highlight: 'Under ₹999',
    inStock: true,
    stockQty: 16,
    lowStockThreshold: 5,
    sortOrder: 6,
  },
  {
    id: 'wm-calligraphy-pen-suite',
    name: 'Pastel Fountain Pen & Seal Studio',
    category: 'Stationery',
    price: 499,
    unitLabel: 'per kit',
    shortDescription:
      'Trio of pastel ink pens, brass page markers, and ivory wax beads for letter-writing.',
    details:
      'Ideal for stationery collectors, students, and wedding invite styling. Smooth ink flow with replaceable cartridges and reusable brass seal spoon.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.7,
    reviewCount: 34,
    imageKey: 'product_stationery_set',
    imageAlt: 'Pastel fountain pens with brass clips and wax seal accessories',
    highlight: 'Under ₹499',
    inStock: true,
    stockQty: 22,
    lowStockThreshold: 5,
    sortOrder: 7,
  },
  {
    id: 'wm-console-gift-edition',
    name: 'Matte Wireless Controller Gift Pack',
    category: 'Gaming',
    price: 1999,
    unitLabel: 'per pack',
    shortDescription:
      'Ergonomic textured wireless controller bundled with braided cable & collector sleeve.',
    details:
      'Plug-and-play compatibility across PC, mobile, and console setups. Arrives inside a matte gift sleeve ready for birthdays and sibling surprises.',
    customisable: true,
    personalisationFee: 75,
    rating: 4.8,
    reviewCount: 29,
    imageKey: 'product_gaming_desk',
    imageAlt: 'Matte wireless gaming controller on oak desk surface',
    highlight: null,
    inStock: true,
    stockQty: 11,
    lowStockThreshold: 5,
    sortOrder: 8,
  },
  {
    id: 'wm-corporate-welcome-kit',
    name: 'Executive Celebration Gift Box',
    category: 'Celebration Hampers',
    price: 1599,
    unitLabel: 'per box',
    shortDescription:
      'Monogrammed insulated tumbler, brass pen, soy candle & custom branded walnut sleeve.',
    details:
      'Tailored for milestone celebrations, Diwali gifting, and client appreciation. Includes recipient name engraving on the keepsake sleeve.',
    customisable: true,
    personalisationFee: 120,
    rating: 4.9,
    reviewCount: 76,
    imageKey: 'product_custom_hamper',
    imageAlt:
      'Executive gift box with monogrammed black tumbler, brass pen, and engraved lid',
    highlight: 'Festive Choice',
    inStock: true,
    stockQty: 12,
    lowStockThreshold: 5,
    sortOrder: 9,
  },
  {
    id: 'wm-led-memory-frame',
    name: 'Glowing Oak LED Photo Frame & Moon Lamp',
    category: 'Customised Gifts',
    price: 1199,
    unitLabel: 'per set',
    shortDescription:
      'Engraved oak warm-LED photo frame paired with glowing crystal moon sphere lamp.',
    details:
      'Custom laser-etched family or couple names with milestone year along the solid oak border, bundled with a USB-powered 3D crystal moon lamp on a matching timber base.',
    customisable: true,
    personalisationFee: 100,
    rating: 4.9,
    reviewCount: 68,
    imageKey: 'product_led_frame',
    imageAlt: 'Glowing oak LED photo frame beside a crystal moon sphere lamp',
    highlight: 'Memory Gift',
    inStock: true,
    stockQty: 4,
    lowStockThreshold: 5,
    sortOrder: 10,
  },
  {
    id: 'wm-linen-scrapbook',
    name: 'Handmade Polaroid Memory Scrapbook',
    category: 'Customised Gifts',
    price: 799,
    unitLabel: 'per album',
    shortDescription:
      'Sage linen deckle-edge album with brass fountain pen, photo corners & blush satin ribbon.',
    details:
      '48 thick cotton deckle-edge sheets crafted for Polaroid prints and handwritten notes, paired with brass corner guards and a weighted brass keepsake pen.',
    customisable: true,
    personalisationFee: 80,
    rating: 4.9,
    reviewCount: 54,
    imageKey: 'product_polaroid_album',
    imageAlt: 'Sage linen memory scrapbook open with Polaroid prints and brass pen',
    highlight: 'Anniversary Pick',
    inStock: true,
    stockQty: 15,
    lowStockThreshold: 5,
    sortOrder: 11,
  },
  {
    id: 'wm-walnut-desk-tray',
    name: 'Walnut Brass Pen & Desk Organiser Tray',
    category: 'Stationery',
    price: 1099,
    unitLabel: 'per tray',
    shortDescription:
      'Handcrafted walnut catchall tray with solid brass pens, hexagonal paperweight & pastel memo cube.',
    details:
      'Elevates study tables and executive workspaces. Solid oiled walnut tray with dedicated pen grooves, pastel cotton memo sheets, and machined brass desk weight.',
    customisable: true,
    personalisationFee: 90,
    rating: 4.8,
    reviewCount: 41,
    imageKey: 'product_desk_organiser',
    imageAlt: 'Walnut desk organiser tray with brass pens and pastel note cube',
    highlight: 'Desk Upgrade',
    inStock: true,
    stockQty: 9,
    lowStockThreshold: 5,
    sortOrder: 12,
  },
  {
    id: 'wm-pastel-study-kit',
    name: 'Aesthetic Pastel Planner & Note Cube Suite',
    category: 'Stationery',
    price: 449,
    unitLabel: 'per kit',
    shortDescription:
      'Layered blush, sage & lavender note cube, fine-tip brass pen & ribboned bookmark bundle.',
    details:
      'Everyday stationery favourite for students, teachers, and journal lovers across Haryana. Smooth 120gsm uncoated sheets that prevent ink bleed with pastel colour coding.',
    customisable: true,
    personalisationFee: 40,
    rating: 4.8,
    reviewCount: 59,
    imageKey: 'product_desk_organiser',
    imageAlt: 'Pastel layered memo cube with brass pens in walnut tray',
    highlight: 'Student Pick',
    inStock: true,
    stockQty: 26,
    lowStockThreshold: 6,
    sortOrder: 13,
  },
  {
    id: 'wm-plum-gaming-headset',
    name: 'Cream & Plum Wireless Gaming Headset + Stand',
    category: 'Gaming',
    price: 2999,
    unitLabel: 'per set',
    shortDescription:
      'Low-latency cream & plum wireless gaming headset with solid walnut display stand & braided cable.',
    details:
      'Plush memory-foam ear cushions, detachable clear-voice boom mic, 40-hour battery life, and a weighted walnut desk stand ready to gift right out of the box.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.9,
    reviewCount: 45,
    imageKey: 'product_gaming_headset',
    imageAlt: 'Matte cream and plum wireless gaming headset on walnut desk stand',
    highlight: 'New Arrival',
    inStock: true,
    stockQty: 3,
    lowStockThreshold: 5,
    sortOrder: 14,
  },
  {
    id: 'wm-braided-desk-pack',
    name: 'Walnut Headset Stand & Braided Cable Pack',
    category: 'Gaming',
    price: 899,
    unitLabel: 'per pack',
    shortDescription:
      'Sculpted walnut headphone stand paired with plum-cream braided USB-C pro cable & woven mat.',
    details:
      'Clean up any gaming or creator desk setup. Features non-slip cork base, optional engraved nameplate on the walnut stand, and high-speed braided charging cable.',
    customisable: true,
    personalisationFee: 60,
    rating: 4.7,
    reviewCount: 27,
    imageKey: 'product_gaming_headset',
    imageAlt: 'Walnut headphone stand and braided plum-cream USB-C cable',
    highlight: 'Setup Essential',
    inStock: true,
    stockQty: 14,
    lowStockThreshold: 5,
    sortOrder: 15,
  },
  {
    id: 'wm-lavender-candle-favour',
    name: 'Mini Lavender Soy Candle & Keepsake Box',
    category: 'Return Gifts',
    price: 299,
    unitLabel: 'per box',
    shortDescription:
      'Amber lavender-amber soy candle & botanical bath vial in blush-rose ribbon box.',
    details:
      'Hand-poured clean-burning soy candle paired with dried lavender botanicals inside a textured linen gift box—ready for wedding mehndi, baby showers, and milestone dinners.',
    customisable: true,
    personalisationFee: 25,
    rating: 4.9,
    reviewCount: 88,
    imageKey: 'product_candle_spa',
    imageAlt: 'Amber soy candle and bath salts jar in dusty rose satin gift box',
    highlight: 'Wedding Favour',
    inStock: true,
    stockQty: 30,
    lowStockThreshold: 8,
    sortOrder: 16,
  },
  {
    id: 'wm-pocket-diary-favour',
    name: 'Ribboned Mini Journal & Pen Return Pack',
    category: 'Return Gifts',
    price: 229,
    unitLabel: 'per pack',
    shortDescription:
      'Pocket hardcover botanical notebook tied with satin ribbon & smooth pastel gel pen.',
    details:
      'Practical and memorable return gift for birthdays, school farewells, and festive get-togethers. Includes custom printed thank-you belly band.',
    customisable: true,
    personalisationFee: 20,
    rating: 4.8,
    reviewCount: 73,
    imageKey: 'product_stationery_set',
    imageAlt: 'Hardcover botanical pocket journal with pastel pen and wax seal',
    highlight: 'Birthday Favour',
    inStock: true,
    stockQty: 38,
    lowStockThreshold: 10,
    sortOrder: 17,
  },
  {
    id: 'wm-truffle-diya-favour',
    name: 'Brass Tea-Light & Truffle Favour Box',
    category: 'Return Gifts',
    price: 349,
    unitLabel: 'per box',
    shortDescription:
      'Hammered brass tea-light holder paired with artisan cocoa truffles in plum-ribbon box.',
    details:
      'Warm festive favour crafted for housewarmings, Diwali gatherings, and pooja return gifting. Packed cleanly in food-safe trays with satin bow.',
    customisable: true,
    personalisationFee: 30,
    rating: 4.9,
    reviewCount: 62,
    imageKey: 'product_chocolate_hamper',
    imageAlt: 'Hammered brass tea-light candle holder with cocoa truffles in gift box',
    highlight: 'Housewarming',
    inStock: true,
    stockQty: 25,
    lowStockThreshold: 8,
    sortOrder: 18,
  },
  {
    id: 'wm-lavender-spa-hamper',
    name: 'Fleur Botanical Candle & Bath Salt Spa Box',
    category: 'Celebration Hampers',
    price: 1499,
    unitLabel: 'per box',
    shortDescription:
      'Full-size lavender & amber soy candle, botanical bath soak jar & linen ribbon keepsake box.',
    details:
      'A calming self-care celebration hamper for birthdays, bridesmaids, Mother’s Day, and thank-you surprises. Includes printed botanical card inside.',
    customisable: true,
    personalisationFee: 80,
    rating: 5.0,
    reviewCount: 64,
    imageKey: 'product_candle_spa',
    imageAlt: 'Botanical lavender soy candle and bath soak gift hamper with satin bow',
    highlight: 'Self-Care Pick',
    inStock: true,
    stockQty: 11,
    lowStockThreshold: 5,
    sortOrder: 19,
  },
  {
    id: 'wm-festive-truffle-hamper',
    name: 'Artisanal Truffle, Roasted Nuts & Brass Diya Box',
    category: 'Celebration Hampers',
    price: 2299,
    unitLabel: 'per hamper',
    shortDescription:
      'Dark cocoa truffles, herbed cashews & roasted almonds in glass jars with hammered brass diya.',
    details:
      'Our grand festive box wrapped in deep plum satin ribbon—curated with gourmet single-origin truffles, slow-roasted nuts, and a solid hammered brass candle holder.',
    customisable: true,
    personalisationFee: 100,
    rating: 5.0,
    reviewCount: 91,
    imageKey: 'product_chocolate_hamper',
    imageAlt: 'Luxury festive gift box with cocoa truffles, roasted nut jars, and brass diya',
    highlight: 'Luxury Hamper',
    inStock: true,
    stockQty: 4,
    lowStockThreshold: 5,
    sortOrder: 20,
  },
  // 10 New Cost-Efficient Haryana Budget Gifts (₹149 – ₹699)
  {
    id: 'wm-blush-ceramic-mug',
    name: 'Blush Matte Monogram Mug & Coaster Set',
    category: 'Customised Gifts',
    price: 399,
    unitLabel: 'per set',
    shortDescription:
      'Velvet-finish blush stoneware mug with personalised name print & cork-backed wooden coaster.',
    details:
      'Microwave-safe 330ml ceramic mug finished in soft blush ivory with subtle gold-toned monogram lettering and a matching walnut veneer coaster—ideal for birthdays and college surprises.',
    customisable: true,
    personalisationFee: 40,
    rating: 4.9,
    reviewCount: 97,
    imageKey: 'hero_gift_gallery',
    imageAlt: 'Stoneware ceramic mug beside ribboned gift boxes',
    highlight: 'Budget Hit',
    inStock: true,
    stockQty: 28,
    lowStockThreshold: 6,
    sortOrder: 21,
  },
  {
    id: 'wm-pastel-gel-pen-trio',
    name: 'Soft Blush & Sage Gel Pen + Sticky Note Pack',
    category: 'Stationery',
    price: 199,
    unitLabel: 'per pack',
    shortDescription:
      'Smooth 0.5mm pastel ink pens, ribbed bookmark clip & matching ruled sticky pad.',
    details:
      'Haryana student & office favourite under ₹199. Quick-dry archival black gel ink housed in soft-touch blush, cream, and sage barrels tied with a neat thank-you sleeve.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.8,
    reviewCount: 118,
    imageKey: 'product_stationery_set',
    imageAlt: 'Pastel stationery pens and journal set',
    highlight: 'Under ₹199',
    inStock: true,
    stockQty: 45,
    lowStockThreshold: 10,
    sortOrder: 22,
  },
  {
    id: 'wm-wooden-name-keychain',
    name: 'Engraved Walnut Keychain & Mini Photo Tag',
    category: 'Customised Gifts',
    price: 149,
    unitLabel: 'per piece',
    shortDescription:
      'Precision laser-engraved walnut wood keyring paired with custom Polaroid wallet keepsake.',
    details:
      'Pocket-friendly personalised keepsake crafted at Ambala Cantt. Add initials, bike number, or anniversary date on real oiled walnut wood with antique brass ring.',
    customisable: true,
    personalisationFee: 20,
    rating: 4.9,
    reviewCount: 134,
    imageKey: 'product_polaroid_album',
    imageAlt: 'Wooden engraved keepsake with Polaroid memory print',
    highlight: 'Starting ₹149',
    inStock: true,
    stockQty: 50,
    lowStockThreshold: 10,
    sortOrder: 23,
  },
  {
    id: 'wm-rose-wax-tealight-duo',
    name: 'Rosewood & Vanilla Tea-Light Gift Duo',
    category: 'Return Gifts',
    price: 179,
    unitLabel: 'per box',
    shortDescription:
      'Pair of hand-poured rose-vanilla soy tealights tucked in a blush satin favour sleeve.',
    details:
      'Built for budget-conscious Haryana weddings, sangeet favours, and festive house visits without compromising on boutique presentation.',
    customisable: true,
    personalisationFee: 15,
    rating: 4.8,
    reviewCount: 82,
    imageKey: 'product_return_gifts',
    imageAlt: 'Return gift favour boxes with blush satin ribbon',
    highlight: 'Under ₹199',
    inStock: true,
    stockQty: 60,
    lowStockThreshold: 12,
    sortOrder: 24,
  },
  {
    id: 'wm-mini-moon-nightlamp',
    name: 'Warm USB Desk Mini Moon Lamp',
    category: 'Customised Gifts',
    price: 499,
    unitLabel: 'per box',
    shortDescription:
      'Touch-dimming warm ambient moon sphere on a compact wooden stand with custom card.',
    details:
      'Instant bedroom and study-table mood glow powered via USB cable. Arrives packed inside a blush-accented gift box with complimentary message card.',
    customisable: true,
    personalisationFee: 50,
    rating: 4.9,
    reviewCount: 74,
    imageKey: 'product_led_frame',
    imageAlt: 'Glowing warm ambient moon sphere lamp on wooden stand',
    highlight: 'Viral Pick',
    inStock: true,
    stockQty: 19,
    lowStockThreshold: 5,
    sortOrder: 25,
  },
  {
    id: 'wm-rgb-braided-gaming-pad',
    name: 'Extended Plum & Cream Stitched Gaming Desk Mat',
    category: 'Gaming',
    price: 599,
    unitLabel: 'per mat',
    shortDescription:
      '80×30cm water-resistant micro-weave speed mat with anti-fray plum-stitched edges.',
    details:
      'Matches both minimal study desks and full RGB gaming rigs. Non-slip natural rubber base ensures zero slide during intense sessions.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.8,
    reviewCount: 52,
    imageKey: 'product_gaming_desk',
    imageAlt: 'Plum and cream gaming desk setup with stitched surface mat',
    highlight: 'Budget Gaming',
    inStock: true,
    stockQty: 21,
    lowStockThreshold: 5,
    sortOrder: 26,
  },
  {
    id: 'wm-mobile-gaming-thumb-kit',
    name: 'Pro Mobile Gamer Trigger & Sleeve Gift Tin',
    category: 'Gaming',
    price: 399,
    unitLabel: 'per tin',
    shortDescription:
      'Clip-on alloy triggers, silver-fibre thumb sleeves & braided Type-C elbow cable in gift tin.',
    details:
      'Cost-efficient hit gift for BGMI and mobile esports players across Haryana colleges. Comes inside a reusable matte plum collector tin.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.7,
    reviewCount: 66,
    imageKey: 'product_gaming_headset',
    imageAlt: 'Gaming accessories in cream and plum theme',
    highlight: 'Under ₹499',
    inStock: true,
    stockQty: 24,
    lowStockThreshold: 5,
    sortOrder: 27,
  },
  {
    id: 'wm-blush-selfcare-mini-box',
    name: 'Sweet Rose & Candle Mini Cheer Hamper',
    category: 'Celebration Hampers',
    price: 699,
    unitLabel: 'per hamper',
    shortDescription:
      'Compact blush ribbon box with mini lavender candle, silk scrunchie, cocoa bar & Polaroid card.',
    details:
      'Our #1 unisex-friendly bestie, sister, or Secret Santa hamper under ₹699. Looks and unboxes like a luxury boutique gift without breaking the budget.',
    customisable: true,
    personalisationFee: 50,
    rating: 5.0,
    reviewCount: 105,
    imageKey: 'product_candle_spa',
    imageAlt: 'Compact blush ribbon gift box with candle and self-care treats',
    highlight: 'Best Seller',
    inStock: true,
    stockQty: 17,
    lowStockThreshold: 5,
    sortOrder: 28,
  },
  {
    id: 'wm-cocoa-almond-celebration',
    name: 'Artisan Almond Truffle & Greeting Ribbon Box',
    category: 'Celebration Hampers',
    price: 549,
    unitLabel: 'per box',
    shortDescription:
      'Roasted almond cocoa truffles paired with blush satin bow & foil-stamped festive greeting.',
    details:
      'Freshly packed celebratory sweet box crafted for Rakhi, Diwali, Bhai Dooj, and anniversary visits across Ambala, Karnal & Chandigarh.',
    customisable: true,
    personalisationFee: 40,
    rating: 4.9,
    reviewCount: 79,
    imageKey: 'product_chocolate_hamper',
    imageAlt: 'Artisan chocolate truffles in festive ribbon gift box',
    highlight: 'Festive Value',
    inStock: true,
    stockQty: 20,
    lowStockThreshold: 5,
    sortOrder: 29,
  },
  {
    id: 'wm-daily-gratitude-journal',
    name: 'A5 Soft-Touch Blush Linen Daily Journal',
    category: 'Stationery',
    price: 349,
    unitLabel: 'per book',
    shortDescription:
      '160 cream dotted/ruled pages with elastic band, ribbon marker & optional gold name foil.',
    details:
      'Lay-flat 100gsm paper built for study notes, sketching, or daily gratitude. Popular return gift and teacher appreciation pick across Haryana.',
    customisable: true,
    personalisationFee: 40,
    rating: 4.8,
    reviewCount: 83,
    imageKey: 'product_desk_organiser',
    imageAlt: 'Soft-touch linen notebook on walnut organiser tray',
    highlight: 'Under ₹399',
    inStock: true,
    stockQty: 32,
    lowStockThreshold: 6,
    sortOrder: 30,
  },
];

function rowToProduct(row: ProductRow): Product {
  const category =
    row.category === 'Bulk Hampers' ? 'Celebration Hampers' : row.category;
  return {
    id: row.id,
    name: row.name,
    category,
    price: row.price,
    unitLabel: row.unit_label,
    shortDescription: row.short_description,
    details: row.details,
    customisable: Boolean(row.customisable),
    personalisationFee: row.personalisation_fee,
    rating: row.rating,
    reviewCount: row.review_count,
    image: row.image_key,
    imageKey: row.image_key as ImageKey,
    imageAlt: row.image_alt,
    highlight: row.highlight ?? undefined,
    inStock: Boolean(row.in_stock),
    stockQty: row.stock_qty ?? 15,
    lowStockThreshold: row.low_stock_threshold ?? 5,
  };
}

function rowToOrder(row: OrderRow): OrderRecord {
  let parsedItems: OrderItemRecord[] = [];
  try {
    parsedItems = JSON.parse(row.items_json) as OrderItemRecord[];
  } catch {
    parsedItems = [];
  }
  const totalAmount = row.total_amount;
  const fallbackGst = totalAmount > 0 ? Math.round((totalAmount * 12) / 112) : 0;
  const gstAmount = row.gst_amount ?? fallbackGst;
  const taxableValue = row.taxable_value ?? Math.max(0, totalAmount - gstAmount);

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email ?? '',
    gstin: row.gstin ?? '',
    fulfilment: row.fulfilment as 'delivery' | 'pickup',
    address: row.address,
    cityPincode: row.city_pincode,
    paymentMethod: row.payment_method as 'cod' | 'upi' | 'whatsapp' | 'store',
    items: parsedItems,
    subtotal: row.subtotal,
    personalisationTotal: row.personalisation_total,
    promoCode: row.promo_code ?? '',
    promoDiscount: row.promo_discount ?? 0,
    deliveryFee: row.delivery_fee,
    taxableValue,
    gstAmount,
    totalAmount,
    status: row.status as OrderStatus,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
  };
}

function rowToEnquiry(row: EnquiryRow): EnquiryRecord {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    subject: row.subject,
    message: row.message,
    status: row.status as EnquiryStatus,
    adminReply: row.admin_reply ?? '',
    createdAt: row.created_at,
  };
}

export class StoreDatabase {
  readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    const isServerless =
      process.env.NETLIFY === 'true' ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
      Boolean(process.env.LAMBDA_TASK_ROOT);
    const defaultPath = isServerless
      ? path.join(os.tmpdir(), 'wishmantra', 'wishmantra.db')
      : path.join(process.cwd(), 'data', 'wishmantra.db');
    const resolvedPath =
      dbPath || process.env.WISHMANTRA_DB_PATH?.trim() || defaultPath;
    if (resolvedPath !== ':memory:') {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    }
    this.db = new DatabaseSync(resolvedPath);
    if (resolvedPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;');
    }
    this.initSchema();
    this.seedIfEmpty();
  }

  getAdminPasscodeHash(): string | null {
    const row = this.db
      .prepare("SELECT value FROM app_meta WHERE key = 'admin_passcode_hash'")
      .get() as { value: string } | undefined;
    return row?.value || null;
  }

  claimAdminPasscodeHash(hash: string): boolean {
    const res = this.db
      .prepare(
        "INSERT OR IGNORE INTO app_meta (key, value) VALUES ('admin_passcode_hash', ?)"
      )
      .run(hash);
    return Number(res.changes) > 0;
  }

  private ensureColumn(table: string, column: string, definition: string): void {
    const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
      name: string;
    }>;
    if (!cols.some((c) => c.name === column)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  private dropColumnIfExists(table: string, column: string): void {
    const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
      name: string;
    }>;
    if (cols.some((c) => c.name === column)) {
      this.db.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    }
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        unit_label TEXT NOT NULL,
        short_description TEXT NOT NULL,
        details TEXT NOT NULL,
        customisable INTEGER NOT NULL DEFAULT 1,
        personalisation_fee INTEGER NOT NULL DEFAULT 0,
        rating REAL NOT NULL DEFAULT 4.9,
        review_count INTEGER NOT NULL DEFAULT 0,
        image_key TEXT NOT NULL,
        image_alt TEXT NOT NULL,
        highlight TEXT,
        in_stock INTEGER NOT NULL DEFAULT 1,
        stock_qty INTEGER NOT NULL DEFAULT 15,
        low_stock_threshold INTEGER NOT NULL DEFAULT 5,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        gstin TEXT NOT NULL DEFAULT '',
        fulfilment TEXT NOT NULL,
        address TEXT NOT NULL,
        city_pincode TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        items_json TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        personalisation_total INTEGER NOT NULL,
        promo_code TEXT NOT NULL DEFAULT '',
        promo_discount INTEGER NOT NULL DEFAULT 0,
        delivery_fee INTEGER NOT NULL,
        taxable_value INTEGER NOT NULL DEFAULT 0,
        gst_amount INTEGER NOT NULL DEFAULT 0,
        total_amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        admin_notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        admin_reply TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seamless migration for existing databases
    this.ensureColumn('products', 'stock_qty', 'INTEGER NOT NULL DEFAULT 15');
    this.ensureColumn('products', 'low_stock_threshold', 'INTEGER NOT NULL DEFAULT 5');
    this.ensureColumn('orders', 'email', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('orders', 'gstin', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('orders', 'promo_code', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('orders', 'promo_discount', 'INTEGER NOT NULL DEFAULT 0');
    this.ensureColumn('orders', 'taxable_value', 'INTEGER NOT NULL DEFAULT 0');
    this.ensureColumn('orders', 'gst_amount', 'INTEGER NOT NULL DEFAULT 0');
    this.dropColumnIfExists('orders', 'bulk_discount');
    this.dropColumnIfExists('products', 'min_bulk_qty');

    this.db.exec(`
      DROP TABLE IF EXISTS bulk_enquiries;
      UPDATE orders
      SET gst_amount = CAST(ROUND(total_amount * 12.0 / 112.0) AS INTEGER),
          taxable_value = total_amount - CAST(ROUND(total_amount * 12.0 / 112.0) AS INTEGER)
      WHERE gst_amount = 0 AND total_amount > 0;
      UPDATE products SET category = 'Celebration Hampers' WHERE category = 'Bulk Hampers';
    `);
  }

  private seedIfEmpty(): void {
    const seedV3Flag = this.db
      .prepare("SELECT value FROM app_meta WHERE key = 'catalog_seed_v3'")
      .get() as { value: string } | undefined;

    if (!seedV3Flag) {
      const insertProduct = this.db.prepare(`
        INSERT OR IGNORE INTO products (
          id, name, category, price, unit_label, short_description, details,
          customisable, personalisation_fee, rating, review_count,
          image_key, image_alt, highlight, in_stock, stock_qty, low_stock_threshold,
          sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      for (const item of SEED_PRODUCTS) {
        insertProduct.run(
          item.id,
          item.name,
          item.category,
          item.price,
          item.unitLabel,
          item.shortDescription,
          item.details,
          item.customisable ? 1 : 0,
          item.personalisationFee,
          item.rating,
          item.reviewCount,
          item.imageKey,
          item.imageAlt,
          item.highlight ?? null,
          item.inStock ? 1 : 0,
          item.stockQty,
          item.lowStockThreshold,
          item.sortOrder,
          now
        );
      }

      // Ensure key showcase items accurately display realistic stock levels on v3 migration
      const updateSeedStock = this.db.prepare(
        'UPDATE products SET stock_qty = ?, low_stock_threshold = ? WHERE id = ?'
      );
      for (const lowId of ['wm-led-memory-frame', 'wm-plum-gaming-headset', 'wm-festive-truffle-hamper']) {
        const match = SEED_PRODUCTS.find((p) => p.id === lowId);
        if (match) {
          updateSeedStock.run(match.stockQty, match.lowStockThreshold, match.id);
        }
      }

      this.db
        .prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('catalog_seed_v3', '1')")
        .run();
    }

    // Seed Categories
    const catCount = (
      this.db.prepare('SELECT COUNT(*) AS cnt FROM categories').get() as { cnt: number }
    ).cnt;
    if (catCount === 0) {
      const insertCat = this.db.prepare(
        'INSERT OR IGNORE INTO categories (id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      const now = new Date().toISOString();
      for (const cat of DEFAULT_CATEGORIES) {
        insertCat.run(cat.id, cat.name, cat.description, cat.sortOrder, now);
      }
    }

    // Seed Site Settings
    const settingsCount = (
      this.db.prepare('SELECT COUNT(*) AS cnt FROM site_settings').get() as { cnt: number }
    ).cnt;
    if (settingsCount === 0) {
      this.saveSettingsMap(DEFAULT_SETTINGS);
    }

    // Seed Orders
    const orderCount = (
      this.db.prepare('SELECT COUNT(*) AS cnt FROM orders').get() as { cnt: number }
    ).cnt;

    if (orderCount === 0) {
      const insertOrder = this.db.prepare(`
        INSERT INTO orders (
          order_number, customer_name, phone, email, gstin, fulfilment, address, city_pincode,
          payment_method, items_json, subtotal, personalisation_total, promo_code,
          promo_discount, delivery_fee, taxable_value, gst_amount, total_amount,
          status, admin_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const seedOrders = [
        {
          orderNumber: 'WM-4812',
          customerName: 'Ananya Verma',
          phone: '9814211044',
          email: 'ananya.verma@example.in',
          gstin: '',
          fulfilment: 'pickup',
          address: 'Sadar Bazaar Pickup',
          cityPincode: 'Ambala Cantt',
          paymentMethod: 'store',
          items: [
            {
              productId: 'wm-walnut-keepsake',
              name: 'Engraved Walnut Keepsake Box',
              quantity: 1,
              unitPrice: 1499,
              personalisationFee: 150,
              personalisation: {
                customName: 'Dr. Verma Studio',
                giftNote: 'Congratulations on the new clinic!',
                wrapStyle: 'Plum Velvet Box',
              },
            },
          ],
          subtotal: 1499,
          personalisationTotal: 150,
          promoCode: '',
          promoDiscount: 0,
          deliveryFee: 0,
          taxableValue: 1472,
          gstAmount: 177,
          totalAmount: 1649,
          status: 'Ready for Pickup',
          adminNotes: 'Engraving verified. Packed in velvet ribbon.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
          orderNumber: 'WM-4809',
          customerName: 'Rohan Malhotra',
          phone: '9876543201',
          email: '',
          gstin: '',
          fulfilment: 'delivery',
          address: 'House 214, Sector 12',
          cityPincode: 'Panchkula, 134112',
          paymentMethod: 'upi',
          items: [
            {
              productId: 'wm-pro-gaming-desk',
              name: 'Compact Mechanical Gaming Combo',
              quantity: 1,
              unitPrice: 3899,
              personalisationFee: 0,
            },
          ],
          subtotal: 3899,
          personalisationTotal: 0,
          promoCode: '',
          promoDiscount: 0,
          deliveryFee: 0,
          taxableValue: 3481,
          gstAmount: 418,
          totalAmount: 3899,
          status: 'Pending',
          adminNotes: 'Bubble-wrap box & dispatch via Haryana express.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          orderNumber: 'WM-4795',
          customerName: 'Simranjeet Kaur',
          phone: '9416055129',
          email: 'simran.k@example.in',
          gstin: '',
          fulfilment: 'delivery',
          address: '42 Alexandra Road',
          cityPincode: 'Ambala Cantt, 133001',
          paymentMethod: 'cod',
          items: [
            {
              productId: 'wm-sage-folio',
              name: 'Botanical Hardcover Stationery Folio',
              quantity: 2,
              unitPrice: 899,
              personalisationFee: 100,
              personalisation: {
                customName: 'Simran & Kabir',
                giftNote: 'Happy Anniversary',
                wrapStyle: 'Sage Linen Ribbon',
              },
            },
            {
              productId: 'wm-blush-ceramic-mug',
              name: 'Blush Matte Monogram Mug & Coaster Set',
              quantity: 2,
              unitPrice: 399,
              personalisationFee: 0,
            },
          ],
          subtotal: 2596,
          personalisationTotal: 200,
          promoCode: 'GIFT100',
          promoDiscount: 100,
          deliveryFee: 0,
          taxableValue: 2407,
          gstAmount: 289,
          totalAmount: 2696,
          status: 'Completed',
          adminNotes: 'Delivered locally in Ambala Cantt.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        },
        {
          orderNumber: 'WM-4788',
          customerName: 'Neha Jindal',
          phone: '9996123409',
          email: 'neha.j@example.in',
          gstin: '',
          fulfilment: 'delivery',
          address: 'Sector 7, Urban Estate',
          cityPincode: 'Kurukshetra, 136118',
          paymentMethod: 'upi',
          items: [
            {
              productId: 'wm-satin-return-favours',
              name: 'Satin Ribbon Return Gift Box',
              quantity: 5,
              unitPrice: 249,
              personalisationFee: 0,
            },
            {
              productId: 'wm-blush-selfcare-mini-box',
              name: 'Sweet Rose & Candle Mini Cheer Hamper',
              quantity: 1,
              unitPrice: 699,
              personalisationFee: 0,
            },
          ],
          subtotal: 1944,
          personalisationTotal: 0,
          promoCode: 'WISH5',
          promoDiscount: 97,
          deliveryFee: 0,
          taxableValue: 1649,
          gstAmount: 198,
          totalAmount: 1847,
          status: 'Completed',
          adminNotes: 'Dispatched via Kurukshetra courier.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 78).toISOString(),
        },
        {
          orderNumber: 'WM-4771',
          customerName: 'Vikramjit Singh',
          phone: '9812088741',
          email: '',
          gstin: '',
          fulfilment: 'delivery',
          address: 'Model Town, Lane 4',
          cityPincode: 'Karnal, 132001',
          paymentMethod: 'cod',
          items: [
            {
              productId: 'wm-pastel-study-kit',
              name: 'Aesthetic Pastel Planner & Note Cube Suite',
              quantity: 1,
              unitPrice: 449,
              personalisationFee: 0,
            },
          ],
          subtotal: 449,
          personalisationTotal: 0,
          promoCode: '',
          promoDiscount: 0,
          deliveryFee: 59,
          taxableValue: 454,
          gstAmount: 54,
          totalAmount: 508,
          status: 'Cancelled',
          adminNotes: 'Customer rescheduled to weekend pickup.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 105).toISOString(),
        },
      ];

      for (const o of seedOrders) {
        insertOrder.run(
          o.orderNumber,
          o.customerName,
          o.phone,
          o.email,
          o.gstin,
          o.fulfilment,
          o.address,
          o.cityPincode,
          o.paymentMethod,
          JSON.stringify(o.items),
          o.subtotal,
          o.personalisationTotal,
          o.promoCode,
          o.promoDiscount,
          o.deliveryFee,
          o.taxableValue,
          o.gstAmount,
          o.totalAmount,
          o.status,
          o.adminNotes,
          o.createdAt
        );
      }
    }

    // Seed Customer Enquiries
    const enquiryCount = (
      this.db.prepare('SELECT COUNT(*) AS cnt FROM enquiries').get() as { cnt: number }
    ).cnt;
    if (enquiryCount === 0) {
      const insertEnq = this.db.prepare(
        `INSERT INTO enquiries (customer_name, phone, city, subject, message, status, admin_reply, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      insertEnq.run(
        'Ritu Sharma',
        '9813044512',
        'Ambala City',
        'Return gifts for daughter birthday',
        'Looking for 25 ribboned mini journal packs or rose candle boxes under ₹299 each for Saturday.',
        'Open',
        '',
        new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      );
      insertEnq.run(
        'Arjun Bansal',
        '9416211900',
        'Panipat',
        'Engraved walnut box custom font',
        'Can you engrave Hindi or English calligraphy on the walnut keepsake box and deliver to Panipat?',
        'Replied',
        'Yes! We support both English script & neat laser-etched initials with 2-day Panipat courier.',
        new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
      );
    }
  }

  private saveSettingsMap(settings: SiteSettings): void {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)'
    );
    stmt.run('storeName', settings.storeName);
    stmt.run('announcementText', settings.announcementText);
    stmt.run('freeDeliveryThreshold', String(settings.freeDeliveryThreshold));
    stmt.run('standardDeliveryFee', String(settings.standardDeliveryFee));
    stmt.run('phoneDisplay', settings.phoneDisplay);
    stmt.run('address', settings.address);
    stmt.run('hours', settings.hours);
    stmt.run('promoCodesEnabled', settings.promoCodesEnabled ? '1' : '0');
  }

  getSiteSettings(): SiteSettings {
    const rows = this.db
      .prepare('SELECT key, value FROM site_settings')
      .all() as Array<{ key: string; value: string }>;
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      storeName: map.get('storeName') || DEFAULT_SETTINGS.storeName,
      announcementText: map.get('announcementText') || DEFAULT_SETTINGS.announcementText,
      freeDeliveryThreshold: Number(
        map.get('freeDeliveryThreshold') ?? DEFAULT_SETTINGS.freeDeliveryThreshold
      ),
      standardDeliveryFee: Number(
        map.get('standardDeliveryFee') ?? DEFAULT_SETTINGS.standardDeliveryFee
      ),
      phoneDisplay: map.get('phoneDisplay') || DEFAULT_SETTINGS.phoneDisplay,
      address: map.get('address') || DEFAULT_SETTINGS.address,
      hours: map.get('hours') || DEFAULT_SETTINGS.hours,
      promoCodesEnabled:
        map.get('promoCodesEnabled') !== undefined
          ? map.get('promoCodesEnabled') === '1'
          : DEFAULT_SETTINGS.promoCodesEnabled,
    };
  }

  updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
    const current = this.getSiteSettings();
    const threshold = Number(patch.freeDeliveryThreshold);
    const fee = Number(patch.standardDeliveryFee);
    const next: SiteSettings = {
      storeName: patch.storeName?.trim() || current.storeName,
      announcementText:
        patch.announcementText !== undefined
          ? patch.announcementText.trim()
          : current.announcementText,
      freeDeliveryThreshold:
        patch.freeDeliveryThreshold !== undefined && Number.isFinite(threshold)
          ? Math.max(0, Math.round(threshold))
          : current.freeDeliveryThreshold,
      standardDeliveryFee:
        patch.standardDeliveryFee !== undefined && Number.isFinite(fee)
          ? Math.max(0, Math.round(fee))
          : current.standardDeliveryFee,
      phoneDisplay: patch.phoneDisplay?.trim() || current.phoneDisplay,
      address: patch.address?.trim() || current.address,
      hours: patch.hours?.trim() || current.hours,
      promoCodesEnabled:
        patch.promoCodesEnabled !== undefined
          ? Boolean(patch.promoCodesEnabled)
          : current.promoCodesEnabled,
    };
    this.saveSettingsMap(next);
    return next;
  }

  listProducts(includeOutOfStock = false): Product[] {
    const query = includeOutOfStock
      ? 'SELECT * FROM products ORDER BY sort_order ASC, created_at DESC'
      : 'SELECT * FROM products WHERE in_stock = 1 ORDER BY sort_order ASC, created_at DESC';
    const rows = this.db.prepare(query).all() as unknown as ProductRow[];
    return rows.map(rowToProduct);
  }

  getProductById(id: string): Product | null {
    const row = this.db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(id) as unknown as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  }

  createProduct(input: DbProductInput): Product {
    const slugBase = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
    const id = `wm-${slugBase || 'gift'}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const maxOrderRow = this.db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM products')
      .get() as { max_order: number };
    const stockQty = Math.max(0, Math.round(input.stockQty ?? (input.inStock ? 15 : 0)));
    const lowStockThreshold = Math.max(1, Math.round(input.lowStockThreshold ?? 5));

    this.db
      .prepare(
        `INSERT INTO products (
          id, name, category, price, unit_label, short_description, details,
          customisable, personalisation_fee, rating, review_count,
          image_key, image_alt, highlight, in_stock, stock_qty, low_stock_threshold,
          sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name.trim(),
        input.category.trim() || 'Customised Gifts',
        Math.max(1, Math.round(input.price)),
        input.unitLabel.trim() || 'per piece',
        input.shortDescription.trim(),
        input.details.trim() || input.shortDescription.trim(),
        input.customisable ? 1 : 0,
        Math.max(0, Math.round(input.personalisationFee)),
        5.0,
        0,
        input.imageKey,
        input.imageAlt.trim() || input.name.trim(),
        input.highlight?.trim() || null,
        input.inStock && stockQty > 0 ? 1 : 0,
        stockQty,
        lowStockThreshold,
        maxOrderRow.max_order + 1,
        now
      );

    return this.getProductById(id)!;
  }

  updateProduct(id: string, patch: Partial<DbProductInput>): Product | null {
    const existing = this.getProductById(id);
    if (!existing) return null;

    const nextName = patch.name !== undefined ? patch.name.trim() : existing.name;
    const nextCategory = patch.category?.trim() || existing.category;
    const nextPrice =
      patch.price !== undefined ? Math.max(1, Math.round(patch.price)) : existing.price;
    const nextUnitLabel =
      patch.unitLabel !== undefined ? patch.unitLabel.trim() : existing.unitLabel;
    const nextShortDesc =
      patch.shortDescription !== undefined
        ? patch.shortDescription.trim()
        : existing.shortDescription;
    const nextDetails =
      patch.details !== undefined ? patch.details.trim() : existing.details;
    const nextCustomisable =
      patch.customisable !== undefined ? patch.customisable : existing.customisable;
    const nextPersonalisationFee =
      patch.personalisationFee !== undefined
        ? Math.max(0, Math.round(patch.personalisationFee))
        : existing.personalisationFee;
    const nextImageKey = patch.imageKey ?? existing.imageKey ?? 'product_custom_hamper';
    const nextImageAlt =
      patch.imageAlt !== undefined ? patch.imageAlt.trim() : existing.imageAlt;
    const nextHighlight =
      patch.highlight !== undefined ? patch.highlight?.trim() || null : existing.highlight ?? null;

    const nextStockQty =
      patch.stockQty !== undefined
        ? Math.max(0, Math.round(patch.stockQty))
        : (existing.stockQty ?? 15);
    const nextLowThreshold =
      patch.lowStockThreshold !== undefined
        ? Math.max(1, Math.round(patch.lowStockThreshold))
        : (existing.lowStockThreshold ?? 5);

    const nextInStock =
      patch.inStock !== undefined
        ? patch.inStock
        : patch.stockQty !== undefined
          ? nextStockQty > 0
          : Boolean(existing.inStock ?? true);

    this.db
      .prepare(
        `UPDATE products SET
          name = ?, category = ?, price = ?, unit_label = ?, short_description = ?,
          details = ?, customisable = ?, personalisation_fee = ?,
          image_key = ?, image_alt = ?, highlight = ?, in_stock = ?,
          stock_qty = ?, low_stock_threshold = ?
        WHERE id = ?`
      )
      .run(
        nextName,
        nextCategory,
        nextPrice,
        nextUnitLabel,
        nextShortDesc,
        nextDetails,
        nextCustomisable ? 1 : 0,
        nextPersonalisationFee,
        nextImageKey,
        nextImageAlt,
        nextHighlight,
        nextInStock ? 1 : 0,
        nextStockQty,
        nextLowThreshold,
        id
      );

    return this.getProductById(id);
  }

  deleteProduct(id: string): boolean {
    const result = this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }

  listCategories(): CategoryRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM categories ORDER BY sort_order ASC, name ASC')
      .all() as unknown as CategoryRow[];
    const products = this.listProducts(true);

    const counts = new Map<string, { total: number; active: number }>();
    for (const p of products) {
      const curr = counts.get(p.category) ?? { total: 0, active: 0 };
      curr.total += 1;
      if (p.inStock !== false) curr.active += 1;
      counts.set(p.category, curr);
    }

    const result: CategoryRecord[] = rows.map((r) => {
      const c = counts.get(r.name) ?? { total: 0, active: 0 };
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        productCount: c.total,
        activeCount: c.active,
      };
    });

    // Include any product category not explicitly in categories table
    for (const [name, c] of counts.entries()) {
      if (!result.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
        result.push({
          id: `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name,
          description: 'Storefront product category.',
          productCount: c.total,
          activeCount: c.active,
        });
      }
    }
    return result;
  }

  createCategory(input: { name: string; description?: string }): CategoryRecord {
    const cleanName = input.name.trim();
    if (cleanName.length < 2) {
      throw new Error('Category name must be at least 2 characters.');
    }
    const existing = this.db
      .prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)')
      .get(cleanName) as { id: string } | undefined;
    if (existing) {
      throw new Error(`Category "${cleanName}" already exists.`);
    }

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const id = `cat-${slug || 'custom'}-${Math.floor(10 + Math.random() * 90)}`;
    const maxSort = (
      this.db
        .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM categories')
        .get() as { max_sort: number }
    ).max_sort;

    this.db
      .prepare(
        'INSERT INTO categories (id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(id, cleanName, (input.description ?? '').trim(), maxSort + 1, new Date().toISOString());

    return {
      id,
      name: cleanName,
      description: (input.description ?? '').trim(),
      productCount: 0,
      activeCount: 0,
    };
  }

  deleteCategory(id: string): boolean {
    const row = this.db
      .prepare('SELECT name FROM categories WHERE id = ?')
      .get(id) as { name: string } | undefined;
    if (!row) return false;
    const inUse = (
      this.db
        .prepare('SELECT COUNT(*) AS cnt FROM products WHERE category = ?')
        .get(row.name) as { cnt: number }
    ).cnt;
    if (inUse > 0) {
      throw new Error(
        `Cannot delete "${row.name}" while ${inUse} product(s) use it.`
      );
    }
    const res = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  createOrder(payload: {
    form: CheckoutForm;
    items: Array<{
      productId: string;
      quantity: number;
      personalisation?: PersonalisationOptions;
    }>;
  }): OrderRecord {
    const hydratedItems: CartItem[] = [];
    const storedItems: OrderItemRecord[] = [];

    for (const line of payload.items) {
      if (
        !line ||
        typeof line.productId !== 'string' ||
        !Number.isFinite(Number(line.quantity)) ||
        Number(line.quantity) < 1 ||
        Number(line.quantity) > 100
      ) {
        throw new Error('Each item must specify a valid product and quantity between 1 and 100.');
      }

      const product = this.getProductById(line.productId);
      if (!product || product.inStock === false) {
        throw new Error(`Product "${line.productId}" is no longer available.`);
      }
      const qty = Math.floor(Number(line.quantity));
      const cleanPersonalisation =
        product.customisable && line.personalisation
          ? {
              customName: (line.personalisation.customName ?? '').trim().slice(0, 80),
              giftNote: (line.personalisation.giftNote ?? '').trim().slice(0, 240),
              wrapStyle: line.personalisation.wrapStyle,
            }
          : undefined;

      hydratedItems.push({
        cartKey: `${product.id}-${hydratedItems.length}`,
        product,
        quantity: qty,
        personalisation: cleanPersonalisation,
      });

      const hasCustomText = Boolean(
        cleanPersonalisation &&
          (cleanPersonalisation.customName.length > 0 ||
            cleanPersonalisation.giftNote.length > 0)
      );

      storedItems.push({
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        personalisationFee: hasCustomText ? product.personalisationFee : 0,
        personalisation: cleanPersonalisation,
      });
    }

    if (hydratedItems.length === 0) {
      throw new Error('Cannot place an order with an empty bag.');
    }

    const settings = this.getSiteSettings();
    const totals = calculateCartTotals(hydratedItems, {
      fulfilment: payload.form.fulfilment,
      promoCode: settings.promoCodesEnabled ? payload.form.promoCode : '',
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      standardDeliveryFee: settings.standardDeliveryFee,
    });
    const now = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE');
    try {
      let orderNumber = `WM-${Math.floor(5000 + Math.random() * 4999)}`;
      const exists = this.db
        .prepare('SELECT 1 FROM orders WHERE order_number = ?')
        .get(orderNumber);
      if (exists) {
        orderNumber = `WM-${Date.now().toString().slice(-6)}`;
      }

      const insertResult = this.db
        .prepare(
          `INSERT INTO orders (
            order_number, customer_name, phone, email, gstin, fulfilment, address, city_pincode,
            payment_method, items_json, subtotal, personalisation_total, promo_code,
            promo_discount, delivery_fee, taxable_value, gst_amount, total_amount,
            status, admin_notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?)`
        )
        .run(
          orderNumber,
          payload.form.customerName.trim(),
          payload.form.phone.trim(),
          (payload.form.email ?? '').trim(),
          (payload.form.gstin ?? '').trim().toUpperCase(),
          payload.form.fulfilment,
          payload.form.fulfilment === 'pickup'
            ? 'Sadar Bazaar Gallery Pickup'
            : payload.form.address.trim(),
          payload.form.fulfilment === 'pickup'
            ? 'Ambala Cantt, 133001'
            : payload.form.cityPincode.trim(),
          payload.form.paymentMethod,
          JSON.stringify(storedItems),
          totals.subtotal,
          totals.personalisationTotal,
          totals.promoCode,
          totals.promoDiscount,
          totals.deliveryFee,
          totals.taxableValue,
          totals.gstAmount,
          totals.total,
          now
        );

      // Deduct stock gracefully (clamped at 0)
      const decStock = this.db.prepare(
        'UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?'
      );
      for (const item of storedItems) {
        decStock.run(item.quantity, item.productId);
      }

      const createdRow = this.db
        .prepare('SELECT * FROM orders WHERE id = ?')
        .get(Number(insertResult.lastInsertRowid)) as unknown as OrderRow;

      this.db.exec('COMMIT');
      return rowToOrder(createdRow);
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        // ignore rollback error
      }
      throw err;
    }
  }

  listOrders(): OrderRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM orders ORDER BY id DESC')
      .all() as unknown as OrderRow[];
    return rows.map(rowToOrder);
  }

  updateOrderStatus(
    id: number,
    status: OrderStatus,
    adminNotes?: string
  ): OrderRecord | null {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error('Invalid order status.');
    }
    const existing = this.db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(id) as unknown as OrderRow | undefined;
    if (!existing) return null;

    const nextNotes = adminNotes !== undefined ? adminNotes.trim() : existing.admin_notes;
    this.db
      .prepare('UPDATE orders SET status = ?, admin_notes = ? WHERE id = ?')
      .run(status, nextNotes, id);

    const updated = this.db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(id) as unknown as OrderRow;
    return rowToOrder(updated);
  }

  listCustomers(): CustomerSummary[] {
    const orders = this.listOrders();
    const map = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const key = order.phone.trim() || order.customerName.trim().toLowerCase();
      const existing = map.get(key);
      const activeValue = order.status === 'Cancelled' ? 0 : order.totalAmount;

      if (!existing) {
        map.set(key, {
          phone: order.phone,
          name: order.customerName,
          email: order.email,
          city: order.cityPincode || 'Ambala Cantt',
          ordersCount: 1,
          totalSpent: activeValue,
          lastOrderDate: order.createdAt,
          lastOrderNumber: order.orderNumber,
        });
      } else {
        existing.ordersCount += 1;
        existing.totalSpent += activeValue;
        if (!existing.email && order.email) existing.email = order.email;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
          existing.lastOrderNumber = order.orderNumber;
          existing.name = order.customerName;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  createEnquiry(input: {
    customerName: string;
    phone: string;
    city?: string;
    subject: string;
    message: string;
  }): EnquiryRecord {
    const now = new Date().toISOString();
    const res = this.db
      .prepare(
        `INSERT INTO enquiries (customer_name, phone, city, subject, message, status, admin_reply, created_at)
         VALUES (?, ?, ?, ?, ?, 'Open', '', ?)`
      )
      .run(
        input.customerName.trim(),
        input.phone.trim(),
        (input.city ?? '').trim(),
        input.subject.trim(),
        input.message.trim(),
        now
      );

    const created = this.db
      .prepare('SELECT * FROM enquiries WHERE id = ?')
      .get(Number(res.lastInsertRowid)) as unknown as EnquiryRow;
    return rowToEnquiry(created);
  }

  listEnquiries(): EnquiryRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM enquiries ORDER BY id DESC')
      .all() as unknown as EnquiryRow[];
    return rows.map(rowToEnquiry);
  }

  updateEnquiryStatus(
    id: number,
    status: EnquiryStatus,
    adminReply?: string
  ): EnquiryRecord | null {
    if (!ENQUIRY_STATUSES.includes(status)) {
      throw new Error('Invalid enquiry status.');
    }
    const existing = this.db
      .prepare('SELECT * FROM enquiries WHERE id = ?')
      .get(id) as unknown as EnquiryRow | undefined;
    if (!existing) return null;

    const nextReply = adminReply !== undefined ? adminReply.trim() : existing.admin_reply;
    this.db
      .prepare('UPDATE enquiries SET status = ?, admin_reply = ? WHERE id = ?')
      .run(status, nextReply, id);

    const updated = this.db
      .prepare('SELECT * FROM enquiries WHERE id = ?')
      .get(id) as unknown as EnquiryRow;
    return rowToEnquiry(updated);
  }

  getBestSellingProducts(limit = 5): BestSellerStat[] {
    const products = this.listProducts(true);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const orders = this.listOrders().filter((o) => o.status !== 'Cancelled');

    const stats = new Map<string, BestSellerStat>();
    for (const order of orders) {
      for (const line of order.items) {
        const prod = productMap.get(line.productId);
        const lineRevenue = (line.unitPrice + line.personalisationFee) * line.quantity;
        const curr = stats.get(line.productId);
        if (curr) {
          curr.unitsSold += line.quantity;
          curr.revenue += lineRevenue;
        } else {
          stats.set(line.productId, {
            productId: line.productId,
            name: prod?.name ?? line.name,
            category: prod?.category ?? 'Gift Item',
            price: prod?.price ?? line.unitPrice,
            unitsSold: line.quantity,
            revenue: lineRevenue,
            image: prod?.imageKey ?? 'product_custom_hamper',
          });
        }
      }
    }

    return Array.from(stats.values())
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, limit);
  }

  getSalesOverview(days = 7): SalesDayPoint[] {
    const orders = this.listOrders().filter((o) => o.status !== 'Cancelled');
    const points: SalesDayPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      points.push({ label, dateKey, revenue: 0, ordersCount: 0 });
    }

    const indexByDate = new Map(points.map((p) => [p.dateKey, p]));
    for (const order of orders) {
      const key = order.createdAt.slice(0, 10);
      const match = indexByDate.get(key);
      if (match) {
        match.revenue += order.totalAmount;
        match.ordersCount += 1;
      }
    }

    return points;
  }

  getDashboardSummary(): AdminDashboardSummary {
    const revRow = this.db
      .prepare(
        "SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COUNT(*) AS active_orders FROM orders WHERE status != 'Cancelled'"
      )
      .get() as { total_revenue: number; active_orders: number };

    const pendingRow = this.db
      .prepare(
        "SELECT COUNT(*) AS cnt FROM orders WHERE status IN ('Pending', 'Preparing', 'Ready for Pickup')"
      )
      .get() as { cnt: number };

    const totalOrdersRow = this.db
      .prepare('SELECT COUNT(*) AS cnt FROM orders')
      .get() as { cnt: number };

    const activeProdRow = this.db
      .prepare('SELECT COUNT(*) AS cnt FROM products WHERE in_stock = 1')
      .get() as { cnt: number };

    const totalProdRow = this.db
      .prepare('SELECT COUNT(*) AS cnt FROM products')
      .get() as { cnt: number };

    const lowStockRow = this.db
      .prepare('SELECT COUNT(*) AS cnt FROM products WHERE stock_qty <= low_stock_threshold')
      .get() as { cnt: number };

    const totalCustomers = this.listCustomers().length;

    const averageBillValue =
      revRow.active_orders > 0
        ? Math.round(revRow.total_revenue / revRow.active_orders)
        : 0;

    return {
      totalOrders: totalOrdersRow.cnt,
      totalRevenue: revRow.total_revenue,
      totalProducts: totalProdRow.cnt,
      totalCustomers,
      pendingOrders: pendingRow.cnt,
      lowStockProducts: lowStockRow.cnt,
      activeProducts: activeProdRow.cnt,
      averageBillValue,
    };
  }
}
