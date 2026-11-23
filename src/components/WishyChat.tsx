import { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { askWishyChat } from '../utils/api';
import {
  buildWhatsAppProductOrderText,
  buildWhatsAppUrl,
  formatINR,
  type Product,
  type SiteSettings,
} from '../utils/storeLogic';
import { ResilientImage } from './ResilientImage';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendedProducts?: Product[];
  followUpPrompts?: string[];
  isError?: boolean;
}

interface WishyChatProps {
  open: boolean;
  hasStickyBagBar: boolean;
  siteSettings: SiteSettings;
  onToggleOpen: (open: boolean) => void;
  onAddToCart: (product: Product) => void;
  onOpenCustomise: (product: Product) => void;
  onBrowseCollection: () => void;
}

const STARTER_PROMPTS = [
  'Birthday gift under ₹500',
  'Gaming gift under ₹1,000',
  'Customised gift for best friend',
  'Wedding return favours under ₹300',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'wishy-welcome',
  role: 'assistant',
  text: "Hi! I'm Wishy, your WishMantra Gift Advisor. Tell me who you're gifting, the occasion, or your budget (from ₹149) and I'll pick the best matches from our Ambala gallery!",
  followUpPrompts: STARTER_PROMPTS,
};

export function WishyChat({
  open,
  hasStickyBagBar,
  siteSettings,
  onToggleOpen,
  onAddToCart,
  onOpenCustomise,
  onBrowseCollection,
}: WishyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages, sending]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onToggleOpen]);

  const sendPrompt = async (rawText: string) => {
    const prompt = rawText.trim();
    if (!prompt || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: prompt,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'wishy-welcome' && !m.isError)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLastFailedPrompt(null);
    setSending(true);

    try {
      const res = await askWishyChat({
        message: prompt,
        history: historyForApi,
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        recommendedProducts: res.recommendedProducts,
        followUpPrompts: res.followUpPrompts,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message
          : 'Wishy could not fetch gift ideas right now. Please retry.';
      setLastFailedPrompt(prompt);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: errorText,
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setLastFailedPrompt(null);
    setInput('');
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          data-testid="wishy-launcher"
          onClick={() => onToggleOpen(true)}
          aria-label="Ask Wishy gift advisor chatbot"
          className={`fixed right-4 sm:right-6 z-30 inline-flex items-center gap-2.5 min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#23191D] text-[#FDF9FA] border border-[#3F2E35] shadow-[0_10px_28px_rgba(35,25,29,0.24)] hover:bg-[#B83262] hover:border-[#B83262] transition-colors cursor-pointer ${
            hasStickyBagBar ? 'bottom-20 md:bottom-6' : 'bottom-5 sm:bottom-6'
          }`}
        >
          <span className="w-6 h-6 rounded-xl bg-[#FCEFF4] text-[#B83262] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
            Ask Wishy
          </span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Wishy Gift Advisor"
          data-testid="wishy-dialog"
          className={`fixed right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[390px] h-[min(76dvh,580px)] bg-[#FDF9FA] rounded-2xl border border-[#EAD5DC] shadow-[0_20px_50px_rgba(35,25,29,0.22)] flex flex-col overflow-hidden ${
            hasStickyBagBar ? 'bottom-20 md:bottom-6' : 'bottom-4 sm:bottom-6'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-white border-b border-[#F1DCE3] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#FCEFF4] border border-[#F1DCE3] text-[#B83262] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-[#23191D] leading-tight flex items-center gap-1.5">
                  <span>Wishy</span>
                  <span className="text-[11px] font-sans font-semibold text-[#B83262]">
                    · Gift Advisor
                  </span>
                </h2>
                <p className="text-[11px] text-[#6E5C63] truncate">
                  {siteSettings.storeName || 'WishMantra'} live gift &amp; budget finder
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset Wishy chat"
                title="New conversation"
                className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center rounded-lg text-[#6E5C63] hover:text-[#B83262] hover:bg-[#FCEFF4] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                aria-label="Close Wishy chat"
                className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center rounded-lg text-[#6E5C63] hover:text-[#23191D] hover:bg-[#FCEFF4] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5">
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === 'assistant' && idx === messages.length - 1;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-2 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#B83262] text-white rounded-br-sm'
                        : msg.isError
                          ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                          : 'bg-white border border-[#F1DCE3] text-[#23191D] shadow-xs rounded-bl-sm'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.isError && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {lastFailedPrompt && (
                          <button
                            type="button"
                            onClick={() => sendPrompt(lastFailedPrompt)}
                            className="px-2.5 py-1 rounded-md bg-white border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOpen(false);
                            onBrowseCollection();
                          }}
                          className="px-2.5 py-1 rounded-md bg-[#23191D] text-white text-[11px] font-semibold hover:bg-[#B83262] cursor-pointer"
                        >
                          Browse Gift Gallery
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recommended Product Cards */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="w-full space-y-2">
                      {msg.recommendedProducts.map((product) => (
                        <div
                          key={product.id}
                          data-testid={`wishy-rec-${product.id}`}
                          className="bg-white rounded-xl border border-[#F1DCE3] p-2.5 shadow-xs space-y-2"
                        >
                          <div className="flex gap-2.5 items-center">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#FCEFF4] border border-[#F1DCE3] shrink-0">
                              <ResilientImage
                                src={product.image}
                                alt={product.imageAlt}
                                className="w-full h-full object-cover"
                                fallbackTitle={product.name}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B83262]">
                                {product.category}
                              </p>
                              <h3 className="text-xs font-semibold text-[#23191D] truncate">
                                {product.name}
                              </h3>
                              <p className="text-xs font-semibold text-[#23191D] tabular-nums mt-0.5">
                                {formatINR(product.price)}{' '}
                                <span className="text-[10px] font-normal text-[#6E5C63]">
                                  {product.unitLabel}
                                  {product.customisable
                                    ? ` · Engraving +${formatINR(product.personalisationFee)}`
                                    : ''}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => onAddToCart(product)}
                              className="min-h-[32px] px-2 py-1.5 rounded-lg bg-[#23191D] text-white text-[11px] font-medium hover:bg-[#B83262] transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShoppingBag className="w-3 h-3 shrink-0" />
                              <span>Add</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenCustomise(product)}
                              className="min-h-[32px] px-2 py-1.5 rounded-lg border border-[#EAD5DC] bg-white text-[#23191D] text-[11px] font-medium hover:border-[#B83262] hover:text-[#B83262] transition-colors cursor-pointer"
                            >
                              {product.customisable ? 'Personalise' : 'Details'}
                            </button>
                            <a
                              href={buildWhatsAppUrl(
                                buildWhatsAppProductOrderText(
                                  product,
                                  1,
                                  undefined,
                                  siteSettings.storeName
                                ),
                                siteSettings.phoneDisplay
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[32px] px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3 shrink-0" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clickable Prompt Chips on latest assistant message */}
                  {isLastAssistant &&
                    !sending &&
                    msg.followUpPrompts &&
                    msg.followUpPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.followUpPrompts.map((promptText) => (
                          <button
                            key={promptText}
                            type="button"
                            onClick={() => sendPrompt(promptText)}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-[#EAD5DC] text-[11px] font-medium text-[#5A4950] hover:border-[#B83262] hover:text-[#B83262] hover:bg-[#FCEFF4] transition-colors cursor-pointer text-left"
                          >
                            {promptText}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-white border border-[#F1DCE3] px-3.5 py-2.5 text-xs text-[#6E5C63]">
                  Wishy is checking our gift gallery...
                </div>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-[#F1DCE3] flex items-center gap-2 shrink-0"
          >
            <label htmlFor="wishy-input" className="sr-only">
              Ask Wishy for gift recommendations
            </label>
            <input
              ref={inputRef}
              id="wishy-input"
              type="text"
              maxLength={600}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              placeholder="Ask Wishy (e.g. gift for sister under ₹500)..."
              className="flex-1 min-h-[40px] px-3 py-2 text-base sm:text-xs bg-[#FDF9FA] border border-[#EAD5DC] rounded-lg text-[#23191D] placeholder:text-[#9A868E] focus:outline-none focus:border-[#B83262] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              aria-label="Send message to Wishy"
              className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg bg-[#B83262] text-white hover:bg-[#98254F] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
