"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useDeviceUUID, getLanguage, type Language } from "@marcel-games/lib"
import { postLaunch } from "./api"
import { Device } from "@capacitor/device"

type Screen = "splash" | "home" | "game" | "settings"

interface AppContextValue {
  userId: string | null
  language: Language
  screen: Screen
  setScreen: (s: Screen) => void
  isReady: boolean
}

const AppContext = createContext<AppContextValue>({
  userId: null,
  language: "en",
  screen: "splash",
  setScreen: () => {},
  isReady: false,
})

export function useAppContext() {
  return useContext(AppContext)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const deviceUUID = useDeviceUUID()
  const [userId, setUserId] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>("en")
  const [screen, setScreen] = useState<Screen>("splash")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setLanguage(getLanguage())
  }, [])

  useEffect(() => {
    if (!deviceUUID) return

    async function init() {
      try {
        const info = await Device.getInfo()
        const result = await postLaunch({
          deviceUUID: deviceUUID!,
          brand: info.name ?? null,
          osName: info.operatingSystem ?? null,
          osVersion: info.osVersion ?? null,
          modelName: info.model ?? null,
          manufacturer: info.manufacturer ?? null,
          deviceType: info.platform ?? "web",
          isDevice: info.isVirtual === false,
        })
        setUserId(result.userId)
      } catch {
        // offline — allow playing locally
      } finally {
        setIsReady(true)
        setTimeout(() => setScreen("home"), 1500)
      }
    }
    init()
  }, [deviceUUID])

  return (
    <AppContext.Provider value={{ userId, language, screen, setScreen, isReady }}>
      {children}
    </AppContext.Provider>
  )
}
