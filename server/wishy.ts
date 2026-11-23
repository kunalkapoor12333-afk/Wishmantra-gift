import { GoogleGenAI, Type } from '@google/genai';
import {
  formatINR,
  type Product,
  type SiteSettings,
} from '../src/utils/storeLogic.ts';

export interface WishyChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface WishyResult {
  reply: string;
  recommendedProductIds: string[];
  followUpPrompts: string[];
}

export function buildWishyCatalogContext(
  products: Product[],
  settings: SiteSettings
): string {
  const catalogLines = products
    .filter((p) => p.inStock !== false && (p.stockQty ?? 1) > 0)
    .map((p) => {
      const customNote = p.customisable
        ? `customisable (+${formatINR(p.personalisationFee)})`
        : 'ready-to-ship';
      return `- id="${p.id}" | ${p.name} | ${p.category} | ${formatINR(p.price)} (${p.unitLabel}) | ${customNote} | ${p.shortDescription}`;
    });

  return [
    `Store: ${settings.storeName} (${settings.address})`,
    `Hours: ${settings.hours} | Phone / WhatsApp: ${settings.phoneDisplay}`,
    `Delivery: Standard ${formatINR(settings.standardDeliveryFee)}, FREE delivery above ${formatINR(settings.freeDeliveryThreshold)} across Haryana & India. Free store pickup at Sadar Bazaar, Ambala Cantt.`,
    settings.promoCodesEnabled
      ? 'Promo codes: WISH5 (5% off above ₹399), GIFT100 (₹100 off above ₹1,299).'
      : 'Promo codes currently paused.',
    '',
    'LIVE IN-STOCK CATALOG:',
    ...catalogLines,
  ].join('\n');
}

export function extractWishyHistory(
  history?: Array<{ role?: string; text?: string }>
): WishyChatTurn[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (turn): turn is { role: 'user' | 'assistant'; text: string } =>
        (turn?.role === 'user' || turn?.role === 'assistant') &&
        typeof turn.text === 'string' &&
        turn.text.trim().length > 0
    )
    .slice(-6)
    .map((t) => ({
      role: t.role,
      text: t.text.trim().slice(0, 500),
    }));
}

export function parseWishyResponse(
  rawText: string | undefined,
  catalogProducts: Product[]
): WishyResult {
  const validIds = new Set(
    catalogProducts
      .filter((p) => p.inStock !== false)
      .map((p) => p.id)
  );

  const cleaned = (rawText ?? '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  if (!cleaned) {
    throw new Error('Wishy returned an empty response. Please try asking again.');
  }

  let parsed: {
    reply?: unknown;
    recommendedProductIds?: unknown;
    followUpPrompts?: unknown;
  };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      reply: cleaned.slice(0, 600),
      recommendedProductIds: [],
      followUpPrompts: ['Gifts under ₹499', 'Customised keepsakes', 'Gaming setups'],
    };
  }

  const reply =
    typeof parsed.reply === 'string' && parsed.reply.trim().length > 0
      ? parsed.reply.trim()
      : 'Here are the closest matches from our Ambala gift gallery!';

  const recommendedProductIds = Array.isArray(parsed.recommendedProductIds)
    ? Array.from(
        new Set(
          parsed.recommendedProductIds.filter(
            (id): id is string => typeof id === 'string' && validIds.has(id)
          )
        )
      ).slice(0, 3)
    : [];

  const followUpPrompts = Array.isArray(parsed.followUpPrompts)
    ? parsed.followUpPrompts
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 48))
        .slice(0, 3)
    : [];

  return {
    reply,
    recommendedProductIds,
    followUpPrompts,
  };
}

export function formatGeminiApiError(err: unknown): {
  status: number;
  message: string;
} {
  let raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.error?.message === 'string') {
      raw = `${parsed.error.status ?? ''} ${parsed.error.code ?? ''} ${parsed.error.message}`.trim();
    }
  } catch {
    // non-JSON error message
  }

  const lower = raw.toLowerCase();
  if (
    lower.includes('permission_denied') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('403')
  ) {
    return {
      status: 403,
      message:
        'Wishy could not connect with the API key. Please check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message:
        'Wishy is handling many requests right now (rate limit reached). Please wait a moment and retry.',
    };
  }
  if (
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('503')
  ) {
    return {
      status: 503,
      message:
        'Wishy is experiencing high demand right now. Please tap Retry in a moment or browse the Gift Gallery.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 502,
      message:
        'Wishy model endpoint was unavailable. Please try again in a moment.',
    };
  }
  return {
    status: 502,
    message: raw || 'Wishy could not reach the gift concierge service right now.',
  };
}

export async function askWishy(params: {
  message: string;
  history?: Array<{ role?: string; text?: string }>;
  products: Product[];
  settings: SiteSettings;
}): Promise<WishyResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'Wishy requires GEMINI_API_KEY to be configured in Settings > Secrets.'
    );
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const catalogContext = buildWishyCatalogContext(params.products, params.settings);
  const turns = extractWishyHistory(params.history);

  const systemInstruction = [
    'You are Wishy, the warm, practical Gift Concierge for WishMantra Gift Gallery in Sadar Bazaar, Ambala Cantt (Haryana).',
    'Your job is to help customers pick the best gift from the LIVE IN-STOCK CATALOG below based on recipient, occasion, style, customisation need, and ₹ budget.',
    'Rules:',
    '1. ONLY recommend exact product IDs from the LIVE IN-STOCK CATALOG. Never invent products, prices, or IDs.',
    '2. Respect budget limits carefully. If the customer asks for under ₹500, recommend items ₹499 or lower (or explain clearly if personalisation adds ₹30–₹50).',
    '3. Keep replies crisp, friendly, unisex, and practical (2–4 short sentences max). Mention custom engraving or Ambala pickup / free delivery above threshold when helpful.',
    '4. Return between 1 and 3 best-matching product IDs in recommendedProductIds, and up to 3 short followUpPrompts (under 40 characters each).',
    '',
    catalogContext,
  ].join('\n');

  const conversationContents = [
    ...turns.map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.text }],
    })),
    {
      role: 'user',
      parts: [{ text: params.message.trim() }],
    },
  ];

  const callGenerate = () =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: conversationContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Concise, friendly recommendation from Wishy (2-4 short sentences).',
            },
            recommendedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 3 exact product IDs from the live catalog.',
            },
            followUpPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 3 short follow-up prompt chips for the shopper.',
            },
          },
          required: ['reply', 'recommendedProductIds', 'followUpPrompts'],
        },
      },
    });

  let response;
  try {
    response = await callGenerate();
  } catch (err) {
    const formatted = formatGeminiApiError(err);
    if (formatted.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      response = await callGenerate();
    } else {
      throw err;
    }
  }

  return parseWishyResponse(response.text, params.products);
}
