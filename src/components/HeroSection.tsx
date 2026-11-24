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
    <section id="top" className="border-b border-[#F4C2D7] bg-gradient-to-b from-white via-[#FFF7FA] to-[#FCE4EE]/75">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-7 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-5 flex flex-col justify-center py-1 sm:py-2">
            <p className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-[#C2255C] mb-2.5 sm:mb-3">
              {STORE_INFO.pillars} · Ambala &amp; Haryana
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#2B121D] leading-[1.12] [text-wrap:balance] mb-4 sm:mb-5">
              Thoughtful Gifts for Every Celebration
            </h1>
            <p className="text-sm sm:text-base text-[#5E3E4B] leading-relaxed mb-6 sm:mb-7 max-w-[46ch]">
              Blush-wrapped keepsakes, pastel stationery, mechanical gaming gear, and return favours from{' '}
              <span className="font-medium text-[#2B121D]">Sadar Bazaar, Ambala Cantt</span>—curated to feel boutique-worthy starting at{' '}
              <span className="font-semibold text-[#C2255C] tabular-nums">₹149</span>.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onExploreCollection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#C2255C] text-white text-sm font-semibold hover:bg-[#A11B4A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2255C]"
              >
                <span>Shop Gifts from ₹149</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onShopBudget}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-3 rounded-lg border border-[#F4C2D7] bg-white text-[#2B121D] text-sm font-medium hover:border-[#C2255C] hover:text-[#C2255C] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2255C]"
              >
                <span>Under ₹499 Picks</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch">
              <div className="col-span-12 sm:col-span-8 relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#FCE4EE] border border-[#F4C2D7] shadow-sm">
                <ResilientImage
                  src={HERO_IMAGE}
                  alt="Curated WishMantra gift boxes tied with blush satin ribbons, embossed journal, and ceramic mug"
                  className="w-full h-full object-cover"
                  fallbackTitle="WishMantra Curated Gift Gallery"
                />
              </div>

              <div className="hidden sm:grid col-span-4 grid-rows-2 gap-3 sm:gap-4">
                <div className="relative rounded-2xl overflow-hidden bg-[#FCE4EE] border border-[#F4C2D7] shadow-sm">
                  <ResilientImage
                    src={IMAGE_GALLERY_MAP.product_candle_spa}
                    alt="Lavender soy candle & blush spa box"
                    className="w-full h-full object-cover"
                    fallbackTitle="Self-Care & Spa"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-[#FCE4EE] border border-[#F4C2D7] shadow-sm">
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

        {/* 4-column Service & Trust Strip on soft blush pink card */}
        <div
          id="occasions"
          className="mt-8 sm:mt-10 rounded-2xl bg-[#FCE4EE]/75 border border-[#F4C2D7] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white border border-[#F4C2D7] text-[#C2255C] shrink-0 shadow-2xs">
              <Gift className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#2B121D]">Customised For Everyone</h2>
              <p className="text-xs text-[#5E3E4B] mt-1 leading-relaxed">
                Unisex walnut engraving, blush &amp; sage satin wraps, plus personal gift cards.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white border border-[#F4C2D7] text-[#C2255C] shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#2B121D]">Haryana Budget Value</h2>
              <p className="text-xs text-[#5E3E4B] mt-1 leading-relaxed">
                Boutique packaging starting ₹149 with free delivery above {formatINR(freeDeliveryThreshold)}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white border border-[#F4C2D7] text-[#C2255C] shrink-0 shadow-2xs">
              <Gamepad2 className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#2B121D]">Stationery &amp; Gaming</h2>
              <p className="text-xs text-[#5E3E4B] mt-1 leading-relaxed">
                Pastel journals, gel pen suites, mechanical keyboards &amp; desk mats.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white border border-[#F4C2D7] text-[#C2255C] shrink-0 shadow-2xs">
              <PackageCheck className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-[#2B121D]">Instant GST Billing</h2>
              <p className="text-xs text-[#5E3E4B] mt-1 leading-relaxed">
                Live cart tax invoice, Ambala counter pickup &amp; WhatsApp bill sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
