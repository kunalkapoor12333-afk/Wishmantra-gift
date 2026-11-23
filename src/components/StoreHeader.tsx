import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Heart,
  Lock,
  Menu,
  MessageCircle,
  Phone,
  ShoppingBag,
  X,
} from 'lucide-react';
import { STORE_INFO } from '../data/catalog';
import { buildWhatsAppUrl, type SiteSettings } from '../utils/storeLogic';

interface StoreHeaderProps {
  cartCount: number;
  wishlistCount: number;
  wishlistOnly: boolean;
  siteSettings: SiteSettings;
  onToggleWishlistView: () => void;
  onOpenUnder499: () => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
}

export function StoreHeader({
  cartCount,
  wishlistCount,
  wishlistOnly,
  siteSettings,
  onToggleWishlistView,
  onOpenUnder499,
  onOpenCart,
  onOpenAdmin,
}: StoreHeaderProps) {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="sticky top-0 z-40 bg-[#FDF9FA]/95 backdrop-blur-sm border-b border-[#F1DCE3]">
      {bannerVisible && siteSettings.announcementText && (
        <div className="bg-[#23191D] text-[#FDF9FA] text-[11px] sm:text-xs py-1.5 px-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
            <p className="truncate font-medium tracking-wide">
              <span className="text-[#F7B7CD] mr-1.5">✦</span>
              {siteSettings.announcementText}
            </p>
            <button
              type="button"
              onClick={() => setBannerVisible(false)}
              aria-label="Dismiss announcement"
              className="p-1.5 -mr-1 text-[#FDF9FA]/80 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <header className="max-w-[1200px] mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#23191D] whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B83262]"
        >
          <span>{siteSettings.storeName || STORE_INFO.brandName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B83262] inline-block mt-1" aria-hidden="true" />
        </a>

        {/* Single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A4950]"
        >
          <a
            href="#collection"
            className="hover:text-[#B83262] transition-colors whitespace-nowrap shrink-0"
          >
            Collection
          </a>
          <button
            type="button"
            onClick={onOpenUnder499}
            className="hover:text-[#B83262] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Under ₹499
          </button>
          <a
            href="#occasions"
            className="hover:text-[#B83262] transition-colors whitespace-nowrap shrink-0"
          >
            Categories
          </a>
          <a
            href="#enquiry"
            className="hover:text-[#B83262] transition-colors whitespace-nowrap shrink-0"
          >
            Enquiry
          </a>
          <a
            href="#visit-store"
            className="hover:text-[#B83262] transition-colors whitespace-nowrap shrink-0"
          >
            Visit Store
          </a>
        </nav>

        {/* Actions: Saved + Bag (+ mobile menu) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleWishlistView}
            aria-label={
              wishlistOnly
                ? 'Show all products instead of saved wishlist'
                : `View saved wishlist, ${wishlistCount} items`
            }
            aria-pressed={wishlistOnly}
            className={`inline-flex items-center gap-1 sm:gap-1.5 min-h-[40px] sm:min-h-[42px] px-2.5 sm:px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              wishlistOnly
                ? 'bg-[#FCEFF4] border-[#B83262] text-[#B83262]'
                : 'bg-white border-[#EAD5DC] text-[#23191D] hover:border-[#B83262] hover:text-[#B83262]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                wishlistCount > 0 || wishlistOnly ? 'fill-[#B83262] text-[#B83262]' : ''
              }`}
            />
            <span className="hidden sm:inline">Saved</span>
            <span className="tabular-nums">({wishlistCount})</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping bag, ${cartCount} items`}
            className="inline-flex items-center gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[42px] px-2.5 sm:px-4 py-2 rounded-lg bg-[#B83262] text-white text-xs sm:text-sm font-medium hover:bg-[#98254F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B83262]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] p-2 rounded-lg border border-[#EAD5DC] bg-white text-[#23191D] hover:bg-[#FCEFF4] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#F1DCE3] bg-[#FDF9FA] px-4 py-3.5 flex flex-col gap-1 shadow-lg max-h-[calc(100dvh-5rem)] overflow-y-auto"
        >
          {[
            { href: '#collection', label: 'Collection' },
            { href: '#occasions', label: 'Categories' },
            { href: '#reviews', label: 'Haryana Reviews' },
            { href: '#enquiry', label: 'Gift Enquiry' },
            { href: '#visit-store', label: 'Visit Store' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium text-[#23191D] hover:bg-[#FCEFF4] hover:text-[#B83262] transition-colors"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-4 h-4 text-[#8E7982]" aria-hidden="true" />
            </a>
          ))}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenUnder499();
            }}
            className="flex items-center justify-between min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium text-[#B83262] bg-[#FCEFF4] text-left cursor-pointer"
          >
            <span>Budget Gifts Under ₹499</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="my-2 border-t border-[#F1DCE3] pt-2.5 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${siteSettings.phoneDisplay.replace(/[^+\d]/g, '')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2.5 rounded-lg border border-[#EAD5DC] bg-white text-xs font-semibold text-[#23191D] hover:border-[#B83262] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#B83262]" aria-hidden="true" />
                <span>Call Gallery</span>
              </a>
              <a
                href={buildWhatsAppUrl(
                  'Hello WishMantra! I would like to place a gift order or ask about customisation.',
                  siteSettings.phoneDisplay
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>

            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="flex items-center justify-between min-h-[46px] px-3.5 py-2.5 rounded-lg bg-[#23191D] text-[#FDF9FA] text-sm font-medium hover:bg-[#B83262] transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#F7B7CD]" aria-hidden="true" />
                <span>Admin Login</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#FDF9FA]/75" aria-hidden="true" />
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}
