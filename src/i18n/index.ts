import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import et from "./et.json";

function normalizeLanguage(language: string | null | undefined): "en" | "et" {
  const value = language?.toLowerCase().trim();

  if (!value) {
    return "et";
  }

  if (value === "ee" || value.startsWith("ee-")) {
    return "et";
  }

  if (value === "et" || value.startsWith("et-")) {
    return "et";
  }

  if (value === "en" || value.startsWith("en-")) {
    return "en";
  }

  return "et";
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    et: {
      translation: et,
    },
  },

  lng: typeof window !== "undefined" ? normalizeLanguage(localStorage.getItem("lang")) : "et",
  fallbackLng: "en",
  supportedLngs: ["en", "et"],
  nonExplicitSupportedLngs: true,
  load: "languageOnly",

  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lang", normalizeLanguage(lng));
  }
});

export default i18n;
