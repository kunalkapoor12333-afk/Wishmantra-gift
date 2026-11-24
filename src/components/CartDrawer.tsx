import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Receipt,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { submitOrder } from '../utils/api';
import {
  buildWhatsAppCartOrderText,
  buildWhatsAppUrl,
  calculateCartTotals,
  evaluatePromoCode,
  formatINR,
  GST_RATE_PERCENT,
  validateCheckoutForm,
  type CartItem,
  type CheckoutForm,
  type OrderRecord,
  type SiteSettings,
} from '../utils/storeLogic';
import { InvoiceReceipt } from './InvoiceReceipt';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  siteSettings: SiteSettings;
  onClose: () => void;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  open,
  items,
  siteSettings,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const [form, setForm] = useState<CheckoutForm>({
    customerName: '',
    phone: '',
    email: '',
    gstin: '',
    fulfilment: 'delivery',
    address: '',
    cityPincode: '',
    paymentMethod: 'cod',
    promoCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const totals = calculateCartTotals(items, {
    fulfilment: form.fulfilment,
    promoCode: siteSettings.promoCodesEnabled ? appliedPromo : '',
    freeDeliveryThreshold: siteSettings.freeDeliveryThreshold,
    standardDeliveryFee: siteSettings.standardDeliveryFee,
  });

  useEffect(() => {
    if (!open) return;
    if (items.length === 0 && step === 'checkout') {
      setStep('bag');
    }
  }, [open, items.length, step]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleApplyPromo = () => {
    const evalResult = evaluatePromoCode(promoInput, totals.merchandiseTotal);
    if (!promoInput.trim()) {
      setAppliedPromo('');
      setPromoFeedback(null);
      return;
    }
    if (evalResult.valid) {
      setAppliedPromo(evalResult.code);
      setForm((prev) => ({ ...prev, promoCode: evalResult.code }));
      setPromoFeedback({ valid: true, message: evalResult.message });
    } else {
      setPromoFeedback({ valid: false, message: evalResult.message });
    }
  };

  const handleRemovePromo = () => {
    setPromoInput('');
    setAppliedPromo('');
    setPromoFeedback(null);
    setForm((prev) => ({ ...prev, promoCode: '' }));
  };

  const handleCheckoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateCheckoutForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors as Record<string, string>);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const savedOrder = await submitOrder({
        form: {
          ...form,
          promoCode: siteSettings.promoCodesEnabled ? appliedPromo : '',
        },
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          personalisation: item.personalisation,
        })),
      });

      setConfirmedOrder(savedOrder);
      onClearCart();
      setAppliedPromo('');
      setPromoInput('');
      setPromoFeedback(null);
      setStep('confirmed');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not generate bill. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 'confirmed') {
      setStep('bag');
      setConfirmedOrder(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag and Billing"
        className="w-full max-w-md h-[100dvh] bg-[#FDF0F5] border-l border-[#F4C2D7] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="no-print px-4 sm:px-6 py-4 border-b border-[#F4C2D7] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            {step === 'bag' ? (
              <ShoppingBag className="w-5 h-5 text-[#C2255C]" />
            ) : (
              <Receipt className="w-5 h-5 text-[#C2255C]" />
            )}
            <h2 className="font-display text-xl font-semibold text-[#2B121D]">
              {step === 'bag'
                ? `Your Bag & Bill (${totals.itemCount})`
                : step === 'checkout'
                  ? 'Billing & Delivery'
                  : 'Tax Invoice / Bill'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close shopping bag"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center p-2 rounded-lg text-[#5E3E4B] hover:text-[#2B121D] hover:bg-[#FCE4EE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {step === 'confirmed' && confirmedOrder ? (
            <div data-testid="order-confirmation" className="space-y-4">
              <div className="no-print rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Bill #{confirmedOrder.orderNumber} generated for{' '}
                  {confirmedOrder.customerName}
                </span>
              </div>

              <InvoiceReceipt
                order={confirmedOrder}
                compact
                whatsappPhone={siteSettings.phoneDisplay}
              />

              <button
                type="button"
                onClick={handleClose}
                className="no-print w-full min-h-[44px] px-5 py-2.5 rounded-lg border border-[#F4C2D7] bg-white text-sm font-medium text-[#2B121D] hover:border-[#C2255C] cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FCE4EE] border border-[#F4C2D7] text-[#C2255C] mx-auto flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[#2B121D]">
                Your gift bag is empty
              </h3>
              <p className="text-sm text-[#5E3E4B] max-w-xs mx-auto">
                Add customised keepsakes, stationery sets, or gaming combos starting ₹149 to generate your live GST bill.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#C2255C] text-white text-sm font-medium hover:bg-[#A11B4A] transition-colors cursor-pointer"
              >
                Browse Gallery
              </button>
            </div>
          ) : step === 'bag' ? (
            <div className="space-y-5">
              {/* Delivery / Pickup Selector */}
              <div>
                <span className="block text-xs font-semibold text-[#2B121D] mb-2">
                  Fulfilment Option
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, fulfilment: 'delivery' }))
                    }
                    className={`min-h-[40px] py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      form.fulfilment === 'delivery'
                        ? 'border-[#C2255C] bg-[#FCE4EE] text-[#A11B4A]'
                        : 'border-[#F4C2D7] bg-white text-[#5E3E4B]'
                    }`}
                  >
                    Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, fulfilment: 'pickup' }))
                    }
                    className={`min-h-[40px] py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      form.fulfilment === 'pickup'
                        ? 'border-[#C2255C] bg-[#FCE4EE] text-[#A11B4A]'
                        : 'border-[#F4C2D7] bg-white text-[#5E3E4B]'
                    }`}
                  >
                    Store Pickup (Free)
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-[#FCE4EE] border border-[#F4C2D7] px-4 py-3 text-xs text-[#432633]">
                {form.fulfilment === 'pickup' ? (
                  <span className="font-medium text-emerald-700">
                    Free pickup at {siteSettings.address}.
                  </span>
                ) : totals.freeDeliveryRemaining === 0 ? (
                  <span className="font-medium text-emerald-700">
                    Free home delivery unlocked on your bill.
                  </span>
                ) : (
                  <span>
                    Add{' '}
                    <strong className="tabular-nums">
                      {formatINR(totals.freeDeliveryRemaining)}
                    </strong>{' '}
                    more for free delivery (above{' '}
                    {formatINR(siteSettings.freeDeliveryThreshold)}), or choose Store Pickup.
                  </span>
                )}
              </div>

              {/* Line Items */}
              <ul className="space-y-3">
                {items.map((item) => {
                  const hasCustom = Boolean(
                    item.personalisation &&
                      (item.personalisation.customName || item.personalisation.giftNote)
                  );
                  const customFee = hasCustom ? item.product.personalisationFee : 0;
                  const unitPrice = item.product.price + customFee;

                  return (
                    <li
                      key={item.cartKey}
                      className="rounded-xl bg-white border border-[#F4C2D7] p-3.5 flex gap-3.5"
                    >
                      <div className="w-18 h-18 rounded-lg overflow-hidden bg-[#FCE4EE] border border-[#F4C2D7] shrink-0">
                        <ResilientImage
                          src={item.product.image}
                          alt={item.product.imageAlt}
                          className="w-full h-full object-cover"
                          fallbackTitle={item.product.name}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-[#2B121D] leading-snug">
                              {item.product.name}
                            </h3>
                            <p className="text-[11px] text-[#5E3E4B] tabular-nums mt-0.5">
                              Rate: {formatINR(item.product.price)}
                              {customFee > 0 ? ` + ${formatINR(customFee)} custom` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cartKey)}
                            aria-label={`Remove ${item.product.name}`}
                            className="p-1.5 text-[#8C6173] hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.personalisation && (
                          <div className="mt-1 text-xs text-[#5E3E4B] space-y-0.5">
                            <p>Wrap: {item.personalisation.wrapStyle}</p>
                            {item.personalisation.customName && (
                              <p className="text-[#C2255C] font-medium">
                                Engraving: “{item.personalisation.customName}”
                              </p>
                            )}
                            {item.personalisation.giftNote && (
                              <p className="truncate">
                                Note: “{item.personalisation.giftNote}”
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center border border-[#F4C2D7] rounded-md bg-[#FDF0F5]">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              onClick={() => onUpdateQty(item.cartKey, -1)}
                              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#2B121D] hover:text-[#C2255C] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.product.name}`}
                              onClick={() => onUpdateQty(item.cartKey, 1)}
                              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#2B121D] hover:text-[#C2255C] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-semibold text-[#2B121D] tabular-nums">
                            {formatINR(unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Promo Code Input */}
              {siteSettings.promoCodesEnabled && (
                <div className="rounded-xl bg-white border border-[#F4C2D7] p-3.5 space-y-2">
                  <label
                    htmlFor="cart-promo-input"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2B121D]"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#C2255C]" aria-hidden="true" />
                    <span>Promo Code (Try WISH5 or GIFT100)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="cart-promo-input"
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 min-h-[40px] px-3 py-2 text-base sm:text-xs font-mono uppercase bg-[#FDF0F5]/60 border border-[#F4C2D7] rounded-lg focus:outline-none focus:bg-white focus:border-[#C2255C]"
                    />
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#F4C2D7] text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="min-h-[40px] px-4 py-2 rounded-lg bg-[#C2255C] text-white text-xs font-semibold hover:bg-[#A11B4A] transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {promoFeedback && (
                    <p
                      className={`text-[11px] font-medium ${
                        promoFeedback.valid ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {promoFeedback.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form
              id="checkout-form"
              onSubmit={handleCheckoutSubmit}
              noValidate
              className="space-y-4"
            >
              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
                >
                  {submitError}
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-[#2B121D] mb-2">
                  Fulfilment Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, fulfilment: 'delivery' }))
                    }
                    className={`min-h-[42px] py-2.5 px-3 rounded-lg border text-xs font-medium cursor-pointer ${
                      form.fulfilment === 'delivery'
                        ? 'border-[#C2255C] bg-[#FCE4EE] text-[#A11B4A]'
                        : 'border-[#F4C2D7] bg-white text-[#5E3E4B]'
                    }`}
                  >
                    Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, fulfilment: 'pickup' }))
                    }
                    className={`min-h-[42px] py-2.5 px-3 rounded-lg border text-xs font-medium cursor-pointer ${
                      form.fulfilment === 'pickup'
                        ? 'border-[#C2255C] bg-[#FCE4EE] text-[#A11B4A]'
                        : 'border-[#F4C2D7] bg-white text-[#5E3E4B]'
                    }`}
                  >
                    Ambala Store Pickup
                  </button>
                </div>
              </div>

              {form.fulfilment === 'pickup' && (
                <div className="rounded-lg bg-[#FCE4EE] border border-[#F4C2D7] p-3 text-xs text-[#432633] flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#C2255C] shrink-0 mt-0.5" />
                  <span>
                    Pickup Counter: <strong>{siteSettings.address}</strong> ({siteSettings.hours})
                  </span>
                </div>
              )}

              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-semibold text-[#2B121D] mb-1"
                >
                  Billing / Recipient Full Name
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  autoComplete="name"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="Full name for invoice & delivery"
                  className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-semibold text-[#2B121D] mb-1"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="10-digit mobile"
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-xs font-semibold text-[#2B121D] mb-1"
                  >
                    Email for Bill (optional)
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    value={form.email ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {form.fulfilment === 'delivery' && (
                <>
                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-semibold text-[#2B121D] mb-1"
                    >
                      Delivery &amp; Billing Address
                    </label>
                    <textarea
                      id="checkout-address"
                      rows={2}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="House/Flat No, Sector/Street, Landmark"
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                    />
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-pincode"
                      className="block text-xs font-semibold text-[#2B121D] mb-1"
                    >
                      City &amp; PIN Code (Haryana / India)
                    </label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      autoComplete="postal-code"
                      value={form.cityPincode}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, cityPincode: e.target.value }))
                      }
                      placeholder="e.g. Ambala Cantt, 133001"
                      className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                    />
                    {errors.cityPincode && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.cityPincode}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="checkout-gstin"
                  className="block text-xs font-semibold text-[#2B121D] mb-1"
                >
                  GSTIN for Business Invoice (optional)
                </label>
                <input
                  id="checkout-gstin"
                  type="text"
                  maxLength={15}
                  value={form.gstin ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))
                  }
                  placeholder="15-character GSTIN (leave blank for personal)"
                  className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm font-mono uppercase bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                />
                {errors.gstin && (
                  <p className="mt-1 text-xs text-red-600">{errors.gstin}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-payment"
                  className="block text-xs font-semibold text-[#2B121D] mb-1"
                >
                  Payment Preference
                </label>
                <select
                  id="checkout-payment"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value as CheckoutForm['paymentMethod'],
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#F4C2D7] rounded-lg focus:outline-none focus:border-[#C2255C]"
                >
                  <option value="cod">Cash on Delivery (COD)</option>
                  <option value="upi">UPI on Confirmation</option>
                  <option value="whatsapp">Order &amp; Pay via WhatsApp</option>
                  <option value="store">Pay at Sadar Bazaar Gallery</option>
                </select>
                {form.paymentMethod === 'whatsapp' && (
                  <p className="mt-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                    Generate your GST bill below, then tap <strong>Send Order &amp; Bill on WhatsApp</strong> to confirm payment &amp; dispatch directly on WhatsApp.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer Live Bill Summary & CTA */}
        {items.length > 0 && step !== 'confirmed' && (
          <div
            data-testid="cart-bill-summary"
            className="no-print px-4 sm:px-6 py-4 sm:py-5 border-t border-[#F4C2D7] bg-white space-y-3"
          >
            <dl className="space-y-1.5 text-xs text-[#5E3E4B]">
              <div className="flex justify-between">
                <dt>Item Subtotal ({totals.itemCount} items)</dt>
                <dd className="tabular-nums font-medium text-[#2B121D]">
                  {formatINR(totals.subtotal)}
                </dd>
              </div>
              {totals.personalisationTotal > 0 && (
                <div className="flex justify-between">
                  <dt>Personalisation &amp; Engraving</dt>
                  <dd className="tabular-nums font-medium text-[#2B121D]">
                    +{formatINR(totals.personalisationTotal)}
                  </dd>
                </div>
              )}
              {totals.promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Promo ({totals.promoCode})</dt>
                  <dd className="tabular-nums font-medium">
                    -{formatINR(totals.promoDiscount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>
                  Delivery ({form.fulfilment === 'pickup' ? 'Store Pickup' : 'Standard'})
                </dt>
                <dd className="tabular-nums font-medium text-[#2B121D]">
                  {totals.deliveryFee === 0 ? 'Free' : formatINR(totals.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between text-[11px] text-[#5E3E4B]">
                <dt>
                  Taxable {formatINR(totals.taxableValue)} + GST ({GST_RATE_PERCENT}% incl.)
                </dt>
                <dd className="tabular-nums">{formatINR(totals.gstAmount)}</dd>
              </div>
              <div className="pt-2 border-t border-[#FCE4EE] flex justify-between text-sm font-semibold text-[#2B121D]">
                <dt>Grand Total</dt>
                <dd className="tabular-nums text-base text-[#C2255C]">
                  {formatINR(totals.total)}
                </dd>
              </div>
            </dl>

            {step === 'bag' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full min-h-[46px] py-3 rounded-lg bg-[#C2255C] text-white text-sm font-semibold hover:bg-[#A11B4A] transition-colors cursor-pointer"
                >
                  Proceed to Billing · {formatINR(totals.total)}
                </button>
                <a
                  href={buildWhatsAppUrl(
                    buildWhatsAppCartOrderText(items, totals, {
                      fulfilment: form.fulfilment,
                      customerName: form.customerName,
                      phone: form.phone,
                      address: form.address,
                      cityPincode: form.cityPincode,
                      storeName: siteSettings.storeName,
                    }),
                    siteSettings.phoneDisplay
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="bag-whatsapp-order-btn"
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order Directly on WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep('bag')}
                  className="min-h-[46px] px-4 py-3 rounded-lg border border-[#F4C2D7] bg-white text-xs font-semibold text-[#2B121D] hover:border-[#C2255C] cursor-pointer disabled:opacity-60"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="flex-1 min-h-[46px] py-3 rounded-lg bg-[#C2255C] text-white text-sm font-semibold hover:bg-[#A11B4A] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? 'Generating Bill...'
                    : `Generate Bill & Confirm · ${formatINR(totals.total)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
