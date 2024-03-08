import i18n, { ModuleType, Resource, InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";

import { getLanguage } from "@marcel-games/helpers";

export const initializeI18n = (resources: Resource, defaultLanguage: string = "fr") => {
  const languageDetector = {
    type: "languageDetector" as ModuleType,
    detect: () => getLanguage(defaultLanguage),
  };

  const options: InitOptions = {
    compatibilityJSON: "v3",
    resources,
  };

  i18n.use(languageDetector).use(initReactI18next).init(options);
};
