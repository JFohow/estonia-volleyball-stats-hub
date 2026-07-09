import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import et from "./et.json";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en,
            },
            et: {
                translation: et,
            },
        },

        lng:
            typeof window !== "undefined"
                ? localStorage.getItem("lang") ?? "et"
                : "et",
        fallbackLng: "en",

        interpolation: {
            escapeValue: false,
        },
    });

i18n.on("languageChanged", (lng) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("lang", lng);
    }
});

export default i18n;