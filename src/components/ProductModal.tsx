import { useEffect, useState } from 'react';
import { MessageCircle, Minus, Plus, Star, X } from 'lucide-react';
import { WRAP_STYLES } from '../data/catalog';
import {
  buildWhatsAppProductOrderText,
  buildWhatsAppUrl,
  formatINR,
  type PersonalisationOptions,
  type Product,
  type WrapStyle,
} from '../utils/storeLogic';
import { ResilientImage } from './ResilientImage';

interface ProductModalProps {
  product: Product | null;
  whatsappPhone?: string;
  storeName?: string;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    personalisation?: PersonalisationOptions
  ) => void;
}

export function ProductModal({
  product,
  whatsappPhone,
  storeName,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [giftNote, setGiftNote] = useState('');
  const [wrapStyle, setWrapStyle] = useState<WrapStyle>(WRAP_STYLES[0]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setCustomName('');
    setGiftNote('');
    setWrapStyle(WRAP_STYLES[0]);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const hasCustomText =
    product.customisable &&
    (customName.trim().length > 0 || giftNote.trim().length > 0);
  const unitPrice =
    product.price + (hasCustomText ? product.personalisationFee : 0);
  const lineTotal = unitPrice * quantity;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onAddToCart(
      product,
      quantity,
      product.customisable
        ? {
            customName: customName.trim(),
            giftNote: giftNote.trim(),
            wrapStyle,
          }
        : undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto bg-[#FDF9FA] rounded-t-2xl sm:rounded-2xl border border-[#F1DCE3] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product customisation modal"
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 z-10 min-w-[40px] min-h-[40px] inline-flex items-center justify-center p-2 rounded-lg bg-white/95 border border-[#F1DCE3] text-[#23191D] hover:text-[#B83262] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 bg-[#FCEFF4] p-4 sm:p-5 flex flex-col justify-between">
            <div className="aspect-[16/10] sm:aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-white border border-[#F1DCE3]">
              <ResilientImage
                src={product.image}
                alt={product.imageAlt}
                className="w-full h-full object-cover"
                fallbackTitle={product.name}
              />
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#EAD5DC] text-xs text-[#5A4950] space-y-1">
              <p className="font-semibold text-[#23191D]">Crafted at WishMantra</p>
              <p>Checked and ribbon-packed by hand before pickup or Haryana dispatch.</p>
              {product.customisable && (
                <p className="text-[#B83262] font-medium">
                  Optional engraving / note (+{formatINR(product.personalisationFee)} / item)
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-7 p-5 sm:p-7 space-y-5 bg-white">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6E5C63] mb-1.5">
                <span className="uppercase tracking-wider font-semibold text-[#B83262]">
                  {product.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-[#C58E29] text-[#C58E29]" aria-hidden="true" />
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
              <h2
                id="product-modal-title"
                className="font-display text-2xl sm:text-3xl font-semibold text-[#23191D] leading-tight"
              >
                {product.name}
              </h2>
              <p className="mt-2.5 text-sm text-[#5A4950] leading-relaxed">
                {product.details}
              </p>
            </div>

            {product.customisable && (
              <div className="space-y-4 pt-4 border-t border-[#F1DCE3]">
                <div>
                  <label
                    htmlFor="custom-name-input"
                    className="block text-xs font-semibold text-[#23191D] mb-1.5"
                  >
                    Engraved Name / Monogram (optional)
                  </label>
                  <input
                    id="custom-name-input"
                    type="text"
                    maxLength={40}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Aarav & Meera, or Happy Birthday Riya"
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg text-[#23191D] placeholder:text-[#9A868E] focus:outline-none focus:border-[#B83262]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="wrap-style-select"
                    className="block text-xs font-semibold text-[#23191D] mb-1.5"
                  >
                    Ribbon &amp; Wrap Finish
                  </label>
                  <select
                    id="wrap-style-select"
                    value={wrapStyle}
                    onChange={(e) => setWrapStyle(e.target.value as WrapStyle)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg text-[#23191D] focus:outline-none focus:border-[#B83262]"
                  >
                    {WRAP_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="gift-note-input"
                    className="block text-xs font-semibold text-[#23191D] mb-1.5"
                  >
                    Gift Card Message (optional)
                  </label>
                  <textarea
                    id="gift-note-input"
                    rows={2}
                    maxLength={140}
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Write a personal note to include on the printed card..."
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg text-[#23191D] placeholder:text-[#9A868E] focus:outline-none focus:border-[#B83262]"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#F1DCE3] space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#5A4950]">Quantity</span>
                <div className="inline-flex items-center border border-[#EAD5DC] rounded-lg bg-[#FDF9FA]">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="min-w-[42px] min-h-[42px] inline-flex items-center justify-center text-[#23191D] hover:text-[#B83262] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-sm font-semibold tabular-nums min-w-[2.25rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="min-w-[42px] min-h-[42px] inline-flex items-center justify-center text-[#23191D] hover:text-[#B83262] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={buildWhatsAppUrl(
                    buildWhatsAppProductOrderText(
                      product,
                      quantity,
                      product.customisable
                        ? {
                            customName: customName.trim(),
                            giftNote: giftNote.trim(),
                            wrapStyle,
                          }
                        : undefined,
                      storeName
                    ),
                    whatsappPhone
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="modal-whatsapp-order-btn"
                  className="min-h-[46px] px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Order on WhatsApp</span>
                </a>

                <button
                  type="submit"
                  className="min-h-[46px] px-5 py-3 rounded-lg bg-[#B83262] text-white text-xs sm:text-sm font-semibold hover:bg-[#98254F] transition-colors tabular-nums cursor-pointer whitespace-nowrap"
                >
                  Add to Bag · {formatINR(lineTotal)}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
