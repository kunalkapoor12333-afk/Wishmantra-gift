import { ArrowRight, Gamepad2, Gift, PackageCheck, Sparkles } from 'lucide-react';
import { HERO_IMAGE, IMAGE_GALLERY_MAP, STORE_INFO } from '../data/catalog';
import { formatINR } from '../utils/storeLogic';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  freeDeliveryThreshold: number;
  onExploreCollection: () => void;
  onShopBudget: () => void;
}

export function HeroSection({
  freeDeliveryThreshold,
  onExploreCollection,
  onShopBudget,
}: HeroSectionProps) {
  return (
    <section id="top" className="border-b border-[#F1DCE3] bg-gradient-to-b from-[#FDF9FA] to-[#FCF2F5]/55">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-7 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-5 flex flex-col justify-center py-1 sm:py-2">
            <p className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-[#B83262] mb-2.5 sm:mb-3">
              {STORE_INFO.pillars} · Ambala &amp; Haryana
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#23191D] leading-[1.12] [text-wrap:balance] mb-4 sm:mb-5">
              Thoughtful Gifts for Every Celebration
            </h1>
            <p className="text-sm sm:text-base text-[#5A4950] leading-relaxed mb-6 sm:mb-7 max-w-[46ch]">
              Blush-wrapped keepsakes, pastel stationery, mechanical gaming gear, and return favours from{' '}
              <span className="font-medium text-[#23191D]">Sadar Bazaar, Ambala Cantt</span>—curated to feel boutique-worthy starting at{' '}
              <span className="font-semibold text-[#B83262] tabular-nums">₹149</span>.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onExploreCollection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#B83262] text-white text-sm font-semibold hover:bg-[#98254F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B83262]"
              >
                <span>Shop Gifts from ₹149</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onShopBudget}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-lg border border-[#EAD5DC] bg-white text-[#23191D] text-sm font-medium hover:border-[#B83262] hover:text-[#B83262] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B83262]"
              >
                <span>Under ₹499 Picks</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch">
              <div className="col-span-12 sm:col-span-8 relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FCEFF4] border border-[#F1DCE3] shadow-sm">
                <ResilientImage
                  src={HERO_IMAGE}
                  alt="Curated WishMantra gift boxes tied with blush satin ribbons, embossed journal, and ceramic mug"
                  className="w-full h-full object-cover"
                  fallbackTitle="WishMantra Curated Gift Gallery"
                />
              </div>

              <div className="hidden sm:grid col-span-4 grid-rows-2 gap-3 sm:gap-4">
                <div className="relative rounded-2xl overflow-hidden bg-[#FCEFF4] border border-[#F1DCE3] shadow-sm">
                  <ResilientImage
                    src={IMAGE_GALLERY_MAP.product_candle_spa}
                    alt="Lavender soy candle & blush spa box"
                    className="w-full h-full object-cover"
                    fallbackTitle="Self-Care & Spa"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-[#FCEFF4] border border-[#F1DCE3] shadow-sm">
                  <ResilientImage
                    src={IMAGE_GALLERY_MAP.product_gaming_headset}
                    alt="Cream and plum gaming headset & desk gift"
                    className="w-full h-full object-cover"
                    fallbackTitle="Gaming & Desk"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-column Service & Trust Strip */}
        <div
          id="occasions"
          className="mt-8 sm:mt-10 pt-7 sm:pt-8 border-t border-[#F1DCE3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FCEFF4] text-[#B83262] shrink-0">
              <Gift className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#23191D]">Customised For Everyone</h2>
              <p className="text-xs text-[#6E5C63] mt-1 leading-relaxed">
                Unisex walnut engraving, blush &amp; sage satin wraps, plus personal gift cards.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FCEFF4] text-[#B83262] shrink-0">
              <Sparkles className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#23191D]">Haryana Budget Value</h2>
              <p className="text-xs text-[#6E5C63] mt-1 leading-relaxed">
                Boutique packaging starting ₹149 with free delivery above {formatINR(freeDeliveryThreshold)}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FCEFF4] text-[#B83262] shrink-0">
              <Gamepad2 className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#23191D]">Stationery &amp; Gaming</h2>
              <p className="text-xs text-[#6E5C63] mt-1 leading-relaxed">
                Pastel journals, gel pen suites, mechanical keyboards &amp; desk mats.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FCEFF4] text-[#B83262] shrink-0">
              <PackageCheck className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#23191D]">Instant GST Billing</h2>
              <p className="text-xs text-[#6E5C63] mt-1 leading-relaxed">
                Live cart tax invoice, Ambala counter pickup &amp; WhatsApp bill sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
