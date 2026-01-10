type TranslateParams = {
  text: string;
  target: string;
  source?: string;
  endpoint?: string;
};

const DEFAULT_ENDPOINT =
  import.meta.env.VITE_LIBRETRANSLATE_ENDPOINT || "https://libretranslate.com/translate";
const FALLBACK_ENDPOINT = "https://libretranslate.com/translate";

const cache = new Map<string, string>();

/**
 * Translate plain text using LibreTranslate (or a compatible endpoint).
 * Returns the original text if empty, same-language, or on failure.
 */
export const translateText = async ({
  text,
  target,
  source = "en",
  endpoint = DEFAULT_ENDPOINT,
}: TranslateParams): Promise<string> => {
  const normalizedTarget = target?.split("-")[0] || "en";
  const normalizedSource = source?.split("-")[0] || "en";

  if (!text?.trim() || normalizedTarget === normalizedSource) {
    return text;
  }

  const key = `${endpoint}|${normalizedSource}|${normalizedTarget}|${text}`;
  if (cache.has(key)) return cache.get(key)!;

  const fetchOnce = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: normalizedSource,
        target: normalizedTarget,
        format: "text",
      }),
    });
    if (!res.ok) throw new Error(`Translate failed: ${res.status}`);
    const data = await res.json();
    return data?.translatedText || text;
  };

  try {
    const translated = await fetchOnce(endpoint);
    cache.set(key, translated);
    return translated;
  } catch (err) {
    console.error("translateText error (primary)", err);
    if (endpoint !== FALLBACK_ENDPOINT) {
      try {
        const translated = await fetchOnce(FALLBACK_ENDPOINT);
        cache.set(key, translated);
        return translated;
      } catch (fallbackErr) {
        console.error("translateText error (fallback)", fallbackErr);
      }
    }
    return text;
  }
};
