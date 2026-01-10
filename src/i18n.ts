import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import ml from "./locales/ml.json";
import mr from "./locales/mr.json";
import bn from "./locales/bn.json";
import gu from "./locales/gu.json";
import pa from "./locales/pa.json";

const SUPPORTED_LANGS = ["en", "hi", "kn", "ta", "te", "ml", "mr", "bn", "gu", "pa"] as const;

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  ta: { translation: ta },
  te: { translation: te },
  ml: { translation: ml },
  mr: { translation: mr },
  bn: { translation: bn },
  gu: { translation: gu },
  pa: { translation: pa },
} as const;

const getBrowserLanguage = () => {
  const lang = navigator.language?.split("-")[0] || "en";
  return SUPPORTED_LANGS.includes(lang as (typeof SUPPORTED_LANGS)[number]) ? lang : "en";
};

const savedLang = localStorage.getItem("preferred_language");
const browserLang = getBrowserLanguage();
const initialLang =
  (savedLang && SUPPORTED_LANGS.includes(savedLang as (typeof SUPPORTED_LANGS)[number]) ? savedLang : null) ||
  browserLang;

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
