import heroGiftGalleryImg from '../assets/images/hero_gift_gallery_1794637729480.jpg';
import productCandleSpaImg from '../assets/images/product_candle_spa_1794771554611.jpg';
import productCelebrationBoxImg from '../assets/images/product_celebration_box_1794637732904.jpg';
import productChocolateHamperImg from '../assets/images/product_chocolate_hamper_1794771556070.jpg';
import productCustomHamperImg from '../assets/images/product_custom_hamper_1794637730088.jpg';
import productDeskOrganiserImg from '../assets/images/product_desk_organiser_1794771555716.jpg';
import productGamingDeskImg from '../assets/images/product_gaming_desk_1794637731435.jpg';
import productGamingHeadsetImg from '../assets/images/product_gaming_headset_1794771554778.jpg';
import productLedFrameImg from '../assets/images/product_led_frame_1794771554399.jpg';
import productPolaroidAlbumImg from '../assets/images/product_polaroid_album_1794771555143.jpg';
import productReturnGiftsImg from '../assets/images/product_return_gifts_1794637732806.jpg';
import productStationerySetImg from '../assets/images/product_stationery_set_1794637731076.jpg';
import {
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  type ImageKey,
  type PriceBand,
  type Product,
  type SiteSettings,
  type WrapStyle,
} from '../utils/storeLogic';

export const HERO_IMAGE = heroGiftGalleryImg;

export const IMAGE_GALLERY_MAP: Record<ImageKey, string> = {
  hero_gift_gallery: heroGiftGalleryImg,
  product_custom_hamper: productCustomHamperImg,
  product_stationery_set: productStationerySetImg,
  product_gaming_desk: productGamingDeskImg,
  product_return_gifts: productReturnGiftsImg,
  product_celebration_box: productCelebrationBoxImg,
  product_led_frame: productLedFrameImg,
  product_candle_spa: productCandleSpaImg,
  product_gaming_headset: productGamingHeadsetImg,
  product_polaroid_album: productPolaroidAlbumImg,
  product_desk_organiser: productDeskOrganiserImg,
  product_chocolate_hamper: productChocolateHamperImg,
};

export const IMAGE_OPTIONS: Array<{ key: ImageKey; label: string }> = [
  { key: 'product_custom_hamper', label: 'Engraved Walnut Keepsake Set' },
  { key: 'product_stationery_set', label: 'Botanical Stationery Folio' },
  { key: 'product_gaming_desk', label: 'Mechanical Gaming Desk Pack' },
  { key: 'product_return_gifts', label: 'Ribboned Return Gift Boxes' },
  { key: 'product_celebration_box', label: 'Celebration Ribbon Box' },
  { key: 'product_led_frame', label: 'Glowing Oak LED Photo Frame' },
  { key: 'product_candle_spa', label: 'Lavender Soy Candle Spa Box' },
  { key: 'product_gaming_headset', label: 'Cream & Plum Gaming Headset' },
  { key: 'product_polaroid_album', label: 'Linen Polaroid Memory Book' },
  { key: 'product_desk_organiser', label: 'Brass & Oak Desk Organiser' },
  { key: 'product_chocolate_hamper', label: 'Artisan Truffle & Brass Diya Box' },
  { key: 'hero_gift_gallery', label: 'WishMantra Gallery Showcase' },
];

export function resolveProductImage(rawImageOrKey: string | undefined): string {
  if (!rawImageOrKey) return productCustomHamperImg;
  if (rawImageOrKey in IMAGE_GALLERY_MAP) {
    return IMAGE_GALLERY_MAP[rawImageOrKey as ImageKey];
  }
  if (rawImageOrKey.startsWith('/') || rawImageOrKey.startsWith('http')) {
    return rawImageOrKey;
  }
  return productCustomHamperImg;
}

export const STORE_INFO = {
  brandName: 'WishMantra',
  pillars: 'Stationery · Gaming · Gifts',
  specialtyLine: 'Customised Gifts, Stationery, Gaming & Return Gifts across Haryana.',
  addressLine1: '#5, DC Road, Near Post Office',
  addressLine2: 'Sadar Bazaar, Ambala Cantt',
  phoneDisplay: '+91 89501-23188',
  phoneHref: 'tel:+918950123188',
  instagramHandle: '@WishMantra',
  instagramUrl: 'https://www.instagram.com/wishmantra',
  websiteDisplay: 'www.wishmantra.in',
  hours: 'Mon – Sun · 10:30 AM – 8:30 PM',
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  storeName: 'WishMantra',
  announcementText:
    'Thoughtful gifts starting ₹149 · Ambala Cantt & Haryana dispatch · Free delivery above ₹999',
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  standardDeliveryFee: STANDARD_DELIVERY_FEE,
  phoneDisplay: STORE_INFO.phoneDisplay,
  address: `${STORE_INFO.addressLine1}, ${STORE_INFO.addressLine2}`,
  hours: STORE_INFO.hours,
  promoCodesEnabled: true,
};

export const CATEGORY_TABS = [
  'All',
  'Customised Gifts',
  'Stationery',
  'Gaming',
  'Return Gifts',
  'Celebration Hampers',
] as const;

export const PRICE_BAND_OPTIONS: Array<{ id: PriceBand; label: string }> = [
  { id: 'all', label: 'All Budgets' },
  { id: 'under-299', label: 'Under ₹299' },
  { id: 'under-499', label: 'Under ₹499' },
  { id: '500-999', label: '₹500 – ₹999' },
  { id: '1000-plus', label: '₹1,000+' },
];

export const WRAP_STYLES: WrapStyle[] = [
  'Blush Silk & Kraft',
  'Sage Linen Ribbon',
  'Plum Velvet Box',
];

export const TESTIMONIALS = [
  {
    id: 't1',
    quote:
      'We needed personalised ₹249 candle return boxes within four days. WishMantra matched our blush-and-sage wedding palette, printed every guest tag neatly, and kept everything well within budget.',
    name: 'Mehak Kapoor',
    context: 'Wedding Return Favours · Ambala Cantt',
  },
  {
    id: 't2',
    quote:
      'Picked a braided desk setup pack and an engraved key-holder for my cousin’s birthday. Fast delivery from Ambala Cantt, clean gift wrapping, and zero overpriced markups.',
    name: 'Rohan Malhotra',
    context: 'Gaming Desk Gift · Panchkula',
  },
  {
    id: 't3',
    quote:
      'Ordered 18 ribboned stationery sets and floral mugs for our college farewell. Every piece looked boutique-ready under ₹499 per gift and came with a crisp GST bill.',
    name: 'Simranjit Kaur',
    context: 'College Farewell & Stationery · Kurukshetra',
  },
];

export const FALLBACK_CATALOG_PRODUCTS: Product[] = [
  {
    id: 'wm-walnut-keepsake',
    name: 'Engraved Walnut Keepsake Box',
    category: 'Customised Gifts',
    price: 1499,
    unitLabel: 'per set',
    shortDescription:
      'Laser-engraved walnut chest with monogrammed matte tumbler, amber soy candle & brass pen.',
    details:
      'Crafted for anniversaries, weddings, and milestone birthdays. Personalise the walnut lid with names and date.',
    customisable: true,
    personalisationFee: 150,
    rating: 4.9,
    reviewCount: 84,
    image: productCustomHamperImg,
    imageKey: 'product_custom_hamper',
    imageAlt: 'Engraved walnut keepsake box with matte black monogrammed tumbler and amber soy candle',
    highlight: 'Best Seller',
    inStock: true,
    stockQty: 18,
    lowStockThreshold: 5,
  },
  {
    id: 'wm-botanical-folio',
    name: 'Botanical Hardcover Stationery Folio',
    category: 'Stationery',
    price: 899,
    unitLabel: 'per set',
    shortDescription:
      'Embossed sage linen journal, pastel fountain pens, brass clips & botanical wax seal kit.',
    details:
      '180gsm bleed-proof ivory pages paired with two fine-nib pens and a botanical wax seal stamp.',
    customisable: true,
    personalisationFee: 80,
    rating: 4.9,
    reviewCount: 61,
    image: productStationerySetImg,
    imageKey: 'product_stationery_set',
    imageAlt: 'Botanical embossed hardcover journal with pastel fountain pens and brass wax seal',
    highlight: 'Curated Set',
    inStock: true,
    stockQty: 22,
    lowStockThreshold: 5,
  },
  {
    id: 'wm-gaming-combo',
    name: 'Compact Mechanical Gaming Combo',
    category: 'Gaming',
    price: 3899,
    unitLabel: 'per kit',
    shortDescription:
      '65% hot-swap mechanical keyboard with plum-cream PBT keycaps & wireless dual-mode controller.',
    details:
      'Pre-lubed tactile switches, compact desk footprint, and low-latency wireless controller.',
    customisable: false,
    personalisationFee: 0,
    rating: 4.8,
    reviewCount: 39,
    image: productGamingDeskImg,
    imageKey: 'product_gaming_desk',
    imageAlt: 'Compact mechanical keyboard with plum and cream keycaps beside wireless controller',
    highlight: 'Gamer Pick',
    inStock: true,
    stockQty: 9,
    lowStockThreshold: 4,
  },
  {
    id: 'wm-blush-ceramic-mug',
    name: 'Blush Matte Monogram Mug & Coaster Set',
    category: 'Customised Gifts',
    price: 399,
    unitLabel: 'per set',
    shortDescription:
      'Velvet-finish blush stoneware mug with personalised name print & cork-backed wooden coaster.',
    details:
      'Everyday favourite across Ambala and Chandigarh colleges—dishwasher-safe pastel glaze in a kraft keepsake box.',
    customisable: true,
    personalisationFee: 40,
    rating: 4.9,
    reviewCount: 112,
    image: productCelebrationBoxImg,
    imageKey: 'product_celebration_box',
    imageAlt: 'Blush ceramic monogram mug with cork wooden coaster and ribbon gift box',
    highlight: 'Under ₹499 Hit',
    inStock: true,
    stockQty: 36,
    lowStockThreshold: 8,
  },
  {
    id: 'wm-satin-return-box',
    name: 'Satin Ribbon Return Gift Box',
    category: 'Return Gifts',
    price: 249,
    unitLabel: 'per box',
    shortDescription:
      'Curated keepsake favour box tied in dusty-rose satin ribbon with custom guest tag.',
    details:
      'Includes scented wax sachet, mini artisan truffles, and handwritten thank-you tag.',
    customisable: true,
    personalisationFee: 20,
    rating: 4.9,
    reviewCount: 145,
    image: productReturnGiftsImg,
    imageKey: 'product_return_gifts',
    imageAlt: 'Kraft gift boxes wrapped in dusty-rose satin ribbon with calligraphy name tags',
    highlight: 'Budget Favourite',
    inStock: true,
    stockQty: 48,
    lowStockThreshold: 12,
  },
  {
    id: 'wm-wooden-name-keychain',
    name: 'Laser-Engraved Beechwood Keychain & Pen',
    category: 'Customised Gifts',
    price: 199,
    unitLabel: 'per pair',
    shortDescription:
      'Smooth walnut-toned wooden keychain and metal click pen engraved with recipient name.',
    details:
      'Pocket-friendly personalised token packed in a blush drawstring pouch—ideal for birthdays and college farewells.',
    customisable: true,
    personalisationFee: 30,
    rating: 4.8,
    reviewCount: 164,
    image: productDeskOrganiserImg,
    imageKey: 'product_desk_organiser',
    imageAlt: 'Laser-engraved beechwood keychain and smooth pen in blush gift sleeve',
    highlight: 'Starting ₹199',
    inStock: true,
    stockQty: 55,
    lowStockThreshold: 15,
  },
];
