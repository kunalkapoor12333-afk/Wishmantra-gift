import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Globe,
  Instagram,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
} from 'lucide-react';
import { STORE_INFO, TESTIMONIALS } from '../data/catalog';
import { submitEnquiry } from '../utils/api';
import {
  buildWhatsAppUrl,
  validateEnquiryForm,
  type SiteSettings,
} from '../utils/storeLogic';

interface StoreAndFooterProps {
  siteSettings: SiteSettings;
  onOpenAdmin: () => void;
}

export function StoreAndFooter({ siteSettings, onOpenAdmin }: StoreAndFooterProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Ambala Cantt');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);
  const [lastEnquiryMsg, setLastEnquiryMsg] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validateEnquiryForm({
      customerName,
      phone,
      subject,
      message,
    });
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitEnquiry({ customerName, phone, city, subject, message });
      setLastEnquiryMsg(
        `Hi WishMantra! Enquiry from ${customerName.trim()} (${phone.trim()}, ${city.trim()}):\nTopic: ${subject.trim()}\nDetails: ${message.trim()}`
      );
      setSubmittedOk(true);
      setCustomerName('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not send enquiry right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Customer Testimonials, Enquiry & Ambala Storefront Section */}
      <section id="reviews" className="scroll-mt-20 max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 space-y-10 sm:space-y-12">
        <div>
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#B83262] mb-2">
              Trusted Across Haryana
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#23191D] tracking-tight">
              Loved in Ambala, Panchkula &amp; Kurukshetra
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.id}
                className="rounded-2xl bg-white border border-[#F1DCE3] p-5 sm:p-6 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1 mb-3" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-3.5 h-3.5 fill-[#C58E29] text-[#C58E29]"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#3F2E35] leading-relaxed">
                    “{item.quote}”
                  </p>
                </div>
                <footer className="mt-5 pt-4 border-t border-[#F6E9EE]">
                  <p className="text-sm font-semibold text-[#23191D]">{item.name}</p>
                  <p className="text-xs text-[#6E5C63] mt-0.5">{item.context}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>

        {/* Custom Gift Enquiry Box */}
        <div
          id="enquiry"
          className="scroll-mt-24 rounded-2xl bg-white border border-[#F1DCE3] p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 shadow-xs"
        >
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#B83262]">
              Need Help Choosing?
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#23191D]">
              Send a Custom Gift Enquiry
            </h3>
            <p className="text-sm text-[#5A4950] leading-relaxed">
              Planning birthday return favours, wedding hampers, or custom laser-engraved gifts under a specific budget? Drop a quick note and our Ambala team will reply on WhatsApp or call.
            </p>
            <p className="text-xs text-[#6E5C63]">
              Direct response from Sadar Bazaar Gallery · Haryana &amp; Tricity delivery.
            </p>
          </div>

          <div className="lg:col-span-7">
            {submittedOk ? (
              <div
                data-testid="enquiry-confirmation"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <p className="font-semibold text-sm text-emerald-900">
                  Enquiry Received! Our Ambala studio team will contact you shortly.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <a
                    href={buildWhatsAppUrl(
                      lastEnquiryMsg || 'Hello WishMantra! I submitted a gift enquiry.',
                      siteSettings.phoneDisplay
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Also Send on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSubmittedOk(false)}
                    className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  >
                    Send Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} noValidate className="space-y-3.5">
                {submitError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700"
                  >
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="enq-name"
                      className="block text-xs font-semibold text-[#23191D] mb-1"
                    >
                      Your Name
                    </label>
                    <input
                      id="enq-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      className="w-full min-h-[40px] px-3 py-2 text-base sm:text-xs bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg focus:outline-none focus:border-[#B83262]"
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-[11px] text-red-600">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="enq-phone"
                      className="block text-xs font-semibold text-[#23191D] mb-1"
                    >
                      Mobile / WhatsApp
                    </label>
                    <input
                      id="enq-phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full min-h-[40px] px-3 py-2 text-base sm:text-xs bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg focus:outline-none focus:border-[#B83262]"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="enq-city"
                      className="block text-xs font-semibold text-[#23191D] mb-1"
                    >
                      City (Haryana)
                    </label>
                    <input
                      id="enq-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ambala, Karnal..."
                      className="w-full min-h-[40px] px-3 py-2 text-base sm:text-xs bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg focus:outline-none focus:border-[#B83262]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="enq-subject"
                    className="block text-xs font-semibold text-[#23191D] mb-1"
                  >
                    Occasion / Gift Topic
                  </label>
                  <input
                    id="enq-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Birthday gift under ₹500 or Wedding return boxes"
                    className="w-full min-h-[40px] px-3 py-2 text-base sm:text-xs bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg focus:outline-none focus:border-[#B83262]"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="enq-message"
                    className="block text-xs font-semibold text-[#23191D] mb-1"
                  >
                    Details &amp; Budget
                  </label>
                  <textarea
                    id="enq-message"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us the gift idea, quantity, or target price..."
                    className="w-full px-3 py-2 text-base sm:text-xs bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg focus:outline-none focus:border-[#B83262]"
                  />
                  {errors.message && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B83262] text-white text-xs font-semibold hover:bg-[#98254F] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending...' : 'Send Gift Enquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Storefront Details Banner */}
        <div
          id="visit-store"
          className="scroll-mt-24 rounded-2xl bg-[#FCEFF4] border border-[#F1DCE3] p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center"
        >
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#B83262]">
              Visit Our Gallery
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#23191D]">
              {siteSettings.storeName || STORE_INFO.brandName} · Sadar Bazaar, Ambala Cantt
            </h3>
            <p className="text-sm text-[#5A4950] leading-relaxed max-w-xl">
              Walk in to explore custom engraving samples, aesthetic stationery, gaming peripherals, and budget-friendly return gift hampers ready to wrap.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-xl border border-[#F1DCE3] p-4 space-y-1.5">
              <MapPin className="w-4 h-4 text-[#B83262]" aria-hidden="true" />
              <p className="font-semibold text-[#23191D]">Address</p>
              <p className="text-xs text-[#5A4950] leading-relaxed">
                {siteSettings.address}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#F1DCE3] p-4 space-y-1.5">
              <Phone className="w-4 h-4 text-[#B83262]" aria-hidden="true" />
              <p className="font-semibold text-[#23191D]">Phone &amp; Instagram</p>
              <a
                href={`tel:${siteSettings.phoneDisplay.replace(/[^+\d]/g, '')}`}
                className="inline-flex items-center py-0.5 text-xs font-medium text-[#B83262] hover:underline tabular-nums"
              >
                {siteSettings.phoneDisplay}
              </a>
              <a
                href={buildWhatsAppUrl(
                  'Hello WishMantra! I would like to place an order or ask about a gift.',
                  siteSettings.phoneDisplay
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-0.5 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Order on WhatsApp</span>
              </a>
              <a
                href={STORE_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-0.5 text-xs text-[#5A4950] hover:text-[#B83262] hover:underline"
              >
                Instagram {STORE_INFO.instagramHandle}
              </a>
              <p className="text-xs text-[#6E5C63] flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>{siteSettings.hours}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Deep Plum-Charcoal Footer */}
      <footer className="bg-[#23191D] text-[#F1DCE3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <p className="font-display text-2xl font-semibold text-white">
              {siteSettings.storeName || STORE_INFO.brandName}
            </p>
            <p className="text-xs text-[#D5BDC6] leading-relaxed">
              {STORE_INFO.pillars}. {STORE_INFO.specialtyLine}.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="font-semibold uppercase tracking-wider text-white">
              Shop &amp; Services
            </p>
            <ul className="space-y-2 text-[#DFCBD3]">
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Customised Gifts
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Stationery &amp; Journals
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Gaming Gear
                </a>
              </li>
              <li>
                <a href="#collection" className="hover:text-white transition-colors">
                  Celebration Hampers
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="font-semibold uppercase tracking-wider text-white">
              Store Location
            </p>
            <p className="text-[#DFCBD3] leading-relaxed">{siteSettings.address}</p>
            <p className="text-[#D5BDC6]">{siteSettings.hours}</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="font-semibold uppercase tracking-wider text-white">
              Connect
            </p>
            <ul className="space-y-2 text-[#DFCBD3]">
              <li>
                <a
                  href={buildWhatsAppUrl(
                    'Hello WishMantra! I have a gifting enquiry or order question.',
                    siteSettings.phoneDisplay
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#F7B7CD]" aria-hidden="true" />
                  <span className="tabular-nums">{siteSettings.phoneDisplay} (WhatsApp)</span>
                </a>
              </li>
              <li>
                <a
                  href={STORE_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{STORE_INFO.instagramHandle}</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-[#DFCBD3]">
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{STORE_INFO.websiteDisplay}</span>
              </li>
              <li className="pt-1">
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenAdmin();
                  }}
                  className="inline-flex items-center gap-1.5 text-[#F7B7CD] hover:text-white underline underline-offset-4 transition-colors"
                >
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  <span>Admin Panel</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#BDA7AF]">
            <p>© {new Date().getFullYear()} WishMantra Gift Gallery. All rights reserved.</p>
            <p>Sadar Bazaar, Ambala Cantt · Haryana</p>
          </div>
        </div>
      </footer>
    </>
  );
}
