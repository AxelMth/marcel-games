"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { getLanguage, type Language } from "@/lib/language"
import { t, tReplace } from "@/lib/i18n"

interface LanguageContextValue {
  lang: Language
  t: (key: string) => string
  tReplace: (key: string, params: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with "fr" to match SSR and avoid hydration mismatch; update in useEffect
  const [lang, setLang] = useState<Language>("fr")

  useEffect(() => {
    const detected = getLanguage()
    setLang(detected)
    document.documentElement.lang = detected
  }, [])

  const value: LanguageContextValue = {
    lang,
    t: (key) => t(lang, key),
    tReplace: (key, params) => tReplace(lang, key, params),
  }

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      lang: "fr" as Language,
      t: (key: string) => key,
      tReplace: (key: string, params: Record<string, string | number>) => key,
    }
  }
  return ctx
}
