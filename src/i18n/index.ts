import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

export const SUPPORTED_LANGUAGES = ["zh-CN", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "zh-CN";
export const LANGUAGE_STORAGE_KEY = "campus-flow:language";

/**
 * 将浏览器常见语言标签收敛为项目实际提供的语言资源。
 * 例如 zh、zh-Hans、zh-TW 都暂时回落到简体中文，en-US 回落到英文。
 */
export function normalizeLanguage(language?: string | null): SupportedLanguage {
  const normalized = language?.trim().toLowerCase();

  if (normalized?.startsWith("en")) return "en";
  return DEFAULT_LANGUAGE;
}

function applyDocumentLanguage(language: string) {
  if (typeof document === "undefined") return;

  const supportedLanguage = normalizeLanguage(language);
  document.documentElement.lang = supportedLanguage;
  document.documentElement.dir = i18n.dir(supportedLanguage);
  dayjs.locale(supportedLanguage === "zh-CN" ? "zh-cn" : "en");

  if (!i18n.isInitialized || !i18n.hasResourceBundle(supportedLanguage, "common")) {
    return;
  }

  document.title = i18n.t("meta.title");
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = i18n.t("meta.description");
}

i18n.on("languageChanged", applyDocumentLanguage);
i18n.on("loaded", () => applyDocumentLanguage(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE));

export const i18nReady = i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    load: "currentOnly",
    defaultNS: "common",
    ns: ["common"],
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator", "htmlTag"],
      lookupQuerystring: "lng",
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
      convertDetectedLanguage: normalizeLanguage,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnEmptyString: false,
    returnNull: false,
    debug: import.meta.env.DEV,
  });

export default i18n;
