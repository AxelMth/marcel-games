"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { getLanguage, type Language } from "@marcel-games/lib"
import { t, tReplace } from "@/lib/i18n"

interface LanguageContextValue {
  lang: Language
  t: (key: string) => string
  tReplace: (key: string, params: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
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
      tReplace: (key: string, _params: Record<string, string>) => key,
    }
  }
  return ctx
}
