import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import rw from "@/locales/rw.json";

const KEY = "i18nextLng";
const SUPPORTED = ["en", "fr", "rw"];

// Server and first browser render both use English so the page hydrates cleanly.
// The visitor's language is applied straight after, in applySavedLanguage.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, fr: { translation: fr }, rw: { translation: rw } },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
  });
}

export function applySavedLanguage() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* storage unavailable */
  }
  const browser = navigator.language.slice(0, 2);
  const lng =
    saved && SUPPORTED.includes(saved) ? saved : SUPPORTED.includes(browser) ? browser : "en";
  if (lng !== i18n.language) void i18n.changeLanguage(lng);
  i18n.on("languageChanged", (l) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable */
    }
  });
}

export default i18n;
