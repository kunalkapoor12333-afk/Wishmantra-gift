import { Heart, PenLine, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { CATEGORY_TABS, PRICE_BAND_OPTIONS } from '../data/catalog';
import {
  formatINR,
  type PriceBand,
  type Product,
  type SortOption,
} from '../utils/storeLogic';
import { ResilientImage } from './ResilientImage';

interface CatalogSectionProps {
  products: Product[];
  allCategories?: string[];
  activeCategory: 'All' | string;
  priceBand: PriceBand;
  wishlistOnly: boolean;
  wishlistIds: string[];
  searchQuery: string;
  sortBy: SortOption;
  onCategoryChange: (cat: 'All' | string) => void;
  onPriceBandChange: (band: PriceBand) => void;
  onToggleWishlist: (productId: string) => void;
  onSearchChange: (q: string) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  onQuickAdd: (product: Product) => void;
  onOpenCustomise: (product: Product) => void;
}

export function CatalogSection({
  products,
  allCategories,
  activeCategory,
  priceBand,
  wishlistOnly,
  wishlistIds,
  searchQuery,
  sortBy,
  onCategoryChange,
  onPriceBandChange,
  onToggleWishlist,
  onSearchChange,
  onSortChange,
  onClearFilters,
  onQuickAdd,
  onOpenCustomise,
}: CatalogSectionProps) {
  const categories =
    allCategories && allCategories.length > 0
      ? ['All', ...allCategories]
      : CATEGORY_TABS;

  return (
    <section id="collection" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4 mb-6 sm:mb-7">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#C2255C] mb-2">
              {wishlistOnly ? 'Your Saved Favourites' : 'Curated Gift Gallery'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2B121D] tracking-tight">
              {wishlistOnly ? 'Wishlist Picks' : 'Signature Gifts & Budget Finds'}
            </h2>
          </div>
          <p className="text-sm text-[#5E3E4B] tabular-nums">
            Showing {products.length} {products.length === 1 ? 'gift' : 'gifts'}
          </p>
        </div>

        {/* Category Tabs, Budget Filter & Search/Sort Controls */}
        <div className="space-y-3.5 pb-5 sm:pb-6 mb-7 sm:mb-8 border-b border-[#F4C2D7]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            <div
              role="tablist"
              aria-label="Filter gifts by category"
              className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 p-1 bg-[#FCE4EE] border border-[#F4C2D7] rounded-lg overflow-x-auto no-scrollbar"
            >
              {categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => onCategoryChange(category)}
                    className={`min-h-[38px] px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#C2255C] font-semibold shadow-sm'
                        : 'text-[#5E3E4B] hover:text-[#2B121D]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1 sm:w-64">
                <label htmlFor="catalog-search" className="sr-only">
                  Search gifts, stationery, or gaming items
                </label>
                <Search className="w-4 h-4 text-[#8C6173] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="catalog-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search keepsakes, mugs, gaming..."
                  className="w-full min-h-[42px] pl-9 pr-9 py-2 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg text-[#2B121D] placeholder:text-[#8C6173] focus:outline-none focus:border-[#C2255C]"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#5E3E4B] hover:text-[#2B121D] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-[#5E3E4B] shrink-0" aria-hidden="true" />
                <label htmlFor="catalog-sort" className="sr-only">
                  Sort products
                </label>
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="flex-1 sm:flex-initial min-h-[42px] px-3 py-2 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg text-[#2B121D] focus:outline-none focus:border-[#C2255C] cursor-pointer"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget Quick Filter Strip */}
          <div
            role="group"
            aria-label="Filter gifts by price budget"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-medium text-[#5E3E4B] mr-1">Budget:</span>
            {PRICE_BAND_OPTIONS.map((opt) => {
              const active = priceBand === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPriceBandChange(opt.id)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#C2255C] border-[#C2255C] text-white'
                      : 'bg-white border-[#F4C2D7] text-[#5E3E4B] hover:border-[#C2255C] hover:text-[#C2255C]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-[#F4C2D7] bg-[#FDF0F5] p-8 sm:p-12 text-center shadow-xs">
            <p className="font-display text-2xl text-[#2B121D] mb-2">
              {wishlistOnly ? 'No saved gifts yet' : 'No matching gifts found'}
            </p>
            <p className="text-sm text-[#5E3E4B] mb-6 max-w-md mx-auto">
              {wishlistOnly
                ? 'Tap the heart icon on any product card to save favourites for later comparison.'
                : 'Try clearing your search or budget filter to explore all 30+ gifts in our Ambala gallery.'}
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#C2255C] text-white text-sm font-medium hover:bg-[#A11B4A] transition-colors cursor-pointer"
            >
              Show All Gifts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {products.map((product) => {
              const isSaved = wishlistIds.includes(product.id);
              const lowStock =
                typeof product.stockQty === 'number' &&
                product.stockQty > 0 &&
                product.stockQty <= (product.lowStockThreshold ?? 5);

              return (
                <article
                  key={product.id}
                  data-testid={`product-card-${product.id}`}
                  className="group flex flex-col bg-white rounded-2xl border border-[#F4C2D7] overflow-hidden shadow-[0_2px_10px_rgba(43,18,29,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#E59BB8] hover:shadow-[0_10px_28px_rgba(194,37,92,0.09)]"
                >
                  <div className="relative aspect-[4/3] w-full bg-[#FCE4EE] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onOpenCustomise(product)}
                      aria-label={`View details for ${product.name}`}
                      className="w-full h-full text-left cursor-pointer block"
                    >
                      <ResilientImage
                        src={product.image}
                        alt={product.imageAlt}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        fallbackTitle={product.name}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(product.id)}
                      aria-label={
                        isSaved
                          ? `Remove ${product.name} from saved wishlist`
                          : `Save ${product.name} to wishlist`
                      }
                      aria-pressed={isSaved}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-[#F4C2D7] flex items-center justify-center text-[#5E3E4B] hover:text-[#C2255C] shadow-sm transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-[#C2255C] text-[#C2255C]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-col flex-1 p-4 sm:p-5">
                    {/* Zero-pill clean metadata */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[#5E3E4B] mb-1.5">
                      <span className="uppercase tracking-wider font-semibold text-[#C2255C]">
                        {product.category}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#C58E29] text-[#C58E29]" aria-hidden="true" />
                        <span>{product.rating.toFixed(1)}</span>
                        <span aria-hidden="true">·</span>
                        <span>({product.reviewCount})</span>
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-[#2B121D] leading-snug mb-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCustomise(product)}
                        className="text-left hover:text-[#C2255C] transition-colors cursor-pointer"
                      >
                        {product.name}
                      </button>
                    </h3>

                    <p className="text-sm text-[#5E3E4B] leading-relaxed line-clamp-2 mb-4 flex-1">
                      {product.shortDescription}
                    </p>

                    <div className="pt-3.5 border-t border-[#FCE4EE] flex items-baseline justify-between gap-3 mb-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-semibold text-[#2B121D] tabular-nums">
                          {formatINR(product.price)}
                        </span>
                        <span className="text-xs text-[#5E3E4B]">{product.unitLabel}</span>
                      </div>
                      {lowStock ? (
                        <span className="text-xs font-medium text-[#B45309] tabular-nums">
                          Only {product.stockQty} left
                        </span>
                      ) : (
                        product.highlight && (
                          <span className="text-xs font-medium text-[#5E3E4B]">
                            {product.highlight}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onOpenCustomise(product)}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[#F4C2D7] bg-white text-xs font-semibold text-[#2B121D] hover:border-[#C2255C] hover:text-[#C2255C] hover:bg-[#FDF0F5] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {product.customisable ? (
                          <>
                            <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Personalise</span>
                          </>
                        ) : (
                          <span>Quick View</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onQuickAdd(product)}
                        aria-label={`Add ${product.name} to bag`}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg bg-[#C2255C] text-white text-xs font-semibold hover:bg-[#A11B4A] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
