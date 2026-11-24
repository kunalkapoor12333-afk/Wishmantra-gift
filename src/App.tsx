import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPanel } from './components/admin/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { CatalogSection } from './components/CatalogSection';
import { HeroSection } from './components/HeroSection';
import { ProductModal } from './components/ProductModal';
import { StoreAndFooter } from './components/StoreAndFooter';
import { StoreHeader } from './components/StoreHeader';
import { WishyChat } from './components/WishyChat';
import { DEFAULT_SITE_SETTINGS, FALLBACK_CATALOG_PRODUCTS } from './data/catalog';
import {
  checkAdminSession,
  fetchPublicProducts,
  fetchSiteSettings,
} from './utils/api';
import {
  buildCartKey,
  calculateCartTotals,
  filterAndSortProducts,
  type CartItem,
  type PersonalisationOptions,
  type PriceBand,
  type Product,
  type SiteSettings,
  type SortOption,
} from './utils/storeLogic';

const WISHLIST_STORAGE_KEY = 'wishmantra_wishlist_ids';

function isAdminRoute(): boolean {
  return (
    window.location.pathname.startsWith('/admin') ||
    window.location.hash === '#admin'
  );
}

function loadStoredWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [viewMode, setViewMode] = useState<'store' | 'admin'>(() =>
    isAdminRoute() ? 'admin' : 'store'
  );
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [activeCategory, setActiveCategory] = useState<'All' | string>('All');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadStoredWishlist());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishyOpen, setWishyOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadStorefrontData = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [items, settings] = await Promise.all([
        fetchPublicProducts(),
        fetchSiteSettings().catch(() => DEFAULT_SITE_SETTINGS),
      ]);
      setCatalogProducts(items);
      setSiteSettings(settings);
    } catch {
      setCatalogProducts(FALLBACK_CATALOG_PRODUCTS);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorefrontData();
  }, [loadStorefrontData]);

  useEffect(() => {
    checkAdminSession()
      .then((ok) => setAdminAuthenticated(ok))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setViewMode(isAdminRoute() ? 'admin' : 'store');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (target: 'store' | 'admin') => {
    const nextPath = target === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setViewMode(target);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const categoryList = useMemo(() => {
    const seen = new Set<string>();
    for (const p of catalogProducts) {
      seen.add(p.category);
    }
    return Array.from(seen);
  }, [catalogProducts]);

  const visibleProducts = useMemo(() => {
    const base = wishlistOnly
      ? catalogProducts.filter((p) => wishlistIds.includes(p.id))
      : catalogProducts;
    return filterAndSortProducts(base, {
      category: activeCategory,
      query: searchQuery,
      sortBy,
      priceBand,
    });
  }, [
    catalogProducts,
    wishlistOnly,
    wishlistIds,
    activeCategory,
    searchQuery,
    sortBy,
    priceBand,
  ]);

  const totals = useMemo(
    () =>
      calculateCartTotals(cartItems, {
        freeDeliveryThreshold: siteSettings.freeDeliveryThreshold,
        standardDeliveryFee: siteSettings.standardDeliveryFee,
      }),
    [cartItems, siteSettings]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage restrictions
      }
      return next;
    });
  };

  const handleAddToCart = (
    product: Product,
    quantity = 1,
    personalisation?: PersonalisationOptions
  ) => {
    const cartKey = buildCartKey(product.id, personalisation);
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartKey === cartKey);
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { cartKey, product, quantity, personalisation }];
    });
    showToast(`Added ${product.name} to bag`);
  };

  const handleUpdateQty = (cartKey: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (cartKey: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShopUnder499 = () => {
    setWishlistOnly(false);
    setActiveCategory('All');
    setPriceBand('under-499');
    scrollToSection('collection');
  };

  if (viewMode === 'admin') {
    if (checkingSession) {
      return (
        <div className="min-h-screen bg-[#F7F7F9] flex items-center justify-center text-sm text-slate-500">
          Verifying admin session...
        </div>
      );
    }
    if (!adminAuthenticated) {
      return (
        <AdminLogin
          onSuccess={() => setAdminAuthenticated(true)}
          onBackToStore={() => navigateTo('store')}
        />
      );
    }
    return (
      <AdminPanel
        onBackToStore={() => navigateTo('store')}
        onSignedOut={() => setAdminAuthenticated(false)}
        onCatalogChanged={loadStorefrontData}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2B121D]">
      <StoreHeader
        cartCount={totals.itemCount}
        wishlistCount={wishlistIds.length}
        wishlistOnly={wishlistOnly}
        siteSettings={siteSettings}
        onToggleWishlistView={() => {
          setWishlistOnly((prev) => !prev);
          scrollToSection('collection');
        }}
        onOpenUnder499={handleShopUnder499}
        onOpenCart={() => setCartOpen(true)}
        onOpenAdmin={() => navigateTo('admin')}
      />

      <main className={`flex-1 ${totals.itemCount > 0 ? 'pb-20 md:pb-0' : ''}`}>
        <HeroSection
          freeDeliveryThreshold={siteSettings.freeDeliveryThreshold}
          onExploreCollection={() => scrollToSection('collection')}
          onShopBudget={handleShopUnder499}
        />

        {catalogLoading && catalogProducts.length === 0 ? (
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-96 rounded-2xl bg-[#FDF0F5] border border-[#F4C2D7] animate-pulse"
                />
              ))}
            </div>
          </section>
        ) : (
          <CatalogSection
            products={visibleProducts}
            allCategories={categoryList}
            activeCategory={activeCategory}
            priceBand={priceBand}
            wishlistOnly={wishlistOnly}
            wishlistIds={wishlistIds}
            searchQuery={searchQuery}
            sortBy={sortBy}
            onCategoryChange={setActiveCategory}
            onPriceBandChange={setPriceBand}
            onToggleWishlist={handleToggleWishlist}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
            onClearFilters={() => {
              setActiveCategory('All');
              setPriceBand('all');
              setWishlistOnly(false);
              setSearchQuery('');
              setSortBy('featured');
            }}
            onQuickAdd={(product) => handleAddToCart(product, 1)}
            onOpenCustomise={(product) => setSelectedProduct(product)}
          />
        )}
      </main>

      <StoreAndFooter
        siteSettings={siteSettings}
        onOpenAdmin={() => navigateTo('admin')}
      />

      <ProductModal
        product={selectedProduct}
        whatsappPhone={siteSettings.phoneDisplay}
        storeName={siteSettings.storeName}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        siteSettings={siteSettings}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {totals.itemCount > 0 && !cartOpen && !selectedProduct && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FDF0F5]/95 backdrop-blur-sm border-t border-[#F4C2D7] px-4 py-3 shadow-[0_-4px_20px_rgba(194,37,92,0.1)]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#C2255C] text-white text-sm font-semibold flex items-center justify-between cursor-pointer active:bg-[#A11B4A]"
          >
            <span className="tabular-nums">
              {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} in bag
            </span>
            <span className="tabular-nums">
              View Bag · ₹{totals.total.toLocaleString('en-IN')}
            </span>
          </button>
        </div>
      )}

      {!cartOpen && !selectedProduct && (
        <WishyChat
          open={wishyOpen}
          hasStickyBagBar={totals.itemCount > 0}
          siteSettings={siteSettings}
          onToggleOpen={setWishyOpen}
          onAddToCart={(product) => handleAddToCart(product, 1)}
          onOpenCustomise={(product) => {
            setWishyOpen(false);
            setSelectedProduct(product);
          }}
          onBrowseCollection={() => scrollToSection('collection')}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 rounded-xl bg-[#6B1839] text-white px-4 py-3 text-sm font-medium shadow-lg flex items-center justify-between sm:justify-start gap-3 ${
            totals.itemCount > 0 && !cartOpen
              ? 'bottom-36 md:bottom-6'
              : 'bottom-20 md:bottom-6'
          }`}
        >
          <span className="truncate">{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              setToastMessage(null);
              setCartOpen(true);
            }}
            className="text-xs font-semibold text-[#FFD6E6] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Bag
          </button>
        </div>
      )}
    </div>
  );
}
