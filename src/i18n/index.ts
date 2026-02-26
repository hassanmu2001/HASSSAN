import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import tr from "./locales/tr.json";

const LANG_KEY = "afrahi_lang";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    fr: { translation: fr },
    tr: { translation: tr },
  },
  lng: localStorage.getItem(LANG_KEY) || "ar",
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

// Persist language choice
i18n.on("languageChanged", (lng) => {
  localStorage.setItem(LANG_KEY, lng);
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

// Set initial direction
document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
document.documentElement.lang = i18n.language;

export default i18n;
