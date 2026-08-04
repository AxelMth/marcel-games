"use client"

import { useState, useMemo, useEffect } from "react"
import { Type, MapPin, FileText, Globe, Search, Lightbulb, Lock } from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { useLanguage } from "@/components/language-provider"
import { requestTourReplay } from "@/hooks/use-guided-tour"
import { useRewardedAd } from "@/hooks/use-rewarded-ad"
import {
  getPersistedHints,
  setPersistedHint,
} from "@/lib/hint-storage"
import { Sheet, SheetContent, SheetTitle } from "@marcel-games/ui"

export type HintsHelpVariant = "hints" | "help"

interface HintsHelpSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Content to show; no tab bar — bubble choice determines this. */
  variant: HintsHelpVariant
}

const helpStepsConfig = [
  { icon: Globe, titleKey: "hintsHelp.chooseMode", descKey: "hintsHelp.chooseModeDesc", color: "bg-[#1a8fb5]/15 text-[#1a8fb5]" },
  { icon: Search, titleKey: "hintsHelp.findMissing", descKey: "hintsHelp.findMissingDesc", color: "bg-[#6d9581]/15 text-[#6d9581]" },
  { icon: MapPin, titleKey: "hintsHelp.useMap", descKey: "hintsHelp.useMapDesc", color: "bg-[#f0a830]/15 text-[#f0a830]" },
  { icon: Lightbulb, titleKey: "hintsHelp.getHints", descKey: "hintsHelp.getHintsDesc", color: "bg-[#e54d4d]/15 text-[#e54d4d]" },
]

export function HintsHelpSheet({
  open,
  onOpenChange,
  variant,
}: HintsHelpSheetProps) {
  const { t, tReplace, lang } = useLanguage()
  const {
    gameConfig,
    foundCountries,
    consumeHintFirstLetter,
    consumeHintShowOnMap,
    consumeHintFullName,
  } = useGameStore()
  const { showRewardedAd, isLoading: isAdLoading } = useRewardedAd()
  const [localResult, setLocalResult] = useState<{
    letter?: string
    map?: boolean
    name?: string
  } | null>(null)

  const firstMissingCode = useMemo(() => {
    if (!gameConfig) return null
    const remaining = gameConfig.missingCountries.filter(
      (c) => !foundCountries.some((f) => f.code === c.code)
    )
    return remaining[0]?.code ?? null
  }, [gameConfig, foundCountries])

  // Reset shown hints when moving to next country (when a country is found)
  useEffect(() => {
    setLocalResult(null)
  }, [firstMissingCode])

  const persistedHints = useMemo(() => {
    if (!gameConfig || !firstMissingCode) return null
    return getPersistedHints(
      gameConfig.mode,
      gameConfig.level,
      gameConfig.continent ?? "",
      firstMissingCode
    )
  }, [gameConfig, firstMissingCode])

  const hints = useMemo(() => {
    const letter = localResult?.letter ?? persistedHints?.letter
    const map = localResult?.map ?? persistedHints?.map
    const name = localResult?.name ?? persistedHints?.name
    return { letter, map, name }
  }, [localResult, persistedHints])

  const handleFirstLetter = () => {
    const letter = consumeHintFirstLetter(lang)
    if (letter && gameConfig && firstMissingCode) {
      const result = tReplace("hintsHelp.startsWith", { letter })
      setPersistedHint(
        gameConfig.mode,
        gameConfig.level,
        gameConfig.continent ?? "",
        firstMissingCode,
        "letter",
        result
      )
      setLocalResult((prev) => ({ ...prev, letter: result }))
    }
  }

  const handleShowOnMap = () => {
    showRewardedAd(() => {
      const code = consumeHintShowOnMap()
      if (code && gameConfig && firstMissingCode) {
        setPersistedHint(
          gameConfig.mode,
          gameConfig.level,
          gameConfig.continent ?? "",
          firstMissingCode,
          "map",
          true
        )
        setLocalResult((prev) => ({ ...prev, map: true }))
        onOpenChange(false)
      }
    })
  }

  const handleFullName = () => {
    showRewardedAd(() => {
      const name = consumeHintFullName(lang)
      if (name && gameConfig && firstMissingCode) {
        setPersistedHint(
          gameConfig.mode,
          gameConfig.level,
          gameConfig.continent ?? "",
          firstMissingCode,
          "name",
          name
        )
        setLocalResult((prev) => ({ ...prev, name }))
      }
    })
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto border-t bg-white pb-[env(safe-area-inset-bottom)] p-2"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-[#0f2b3c]/20" />

        {variant === "hints" && (
          <div className="space-y-4 px-1">
            <SheetTitle className="sr-only">Hints</SheetTitle>
            <p className="text-sm text-[#3a6b7e]">
              {t("hintsHelp.tapHint")}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleFirstLetter}
                disabled={!!hints.letter || !firstMissingCode}
                className="flex flex-col gap-3 rounded-xl bg-[#e0f4f8] p-4 text-left transition-all hover:bg-[#d4eef4] active:scale-[0.98] disabled:cursor-default disabled:opacity-100"
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a8fb5]/20">
                    {!firstMissingCode ? (
                      <Lock className="h-5 w-5 text-[#1a8fb5]/50" />
                    ) : (
                      <Type className="h-5 w-5 text-[#1a8fb5]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {hints.letter ? (
                      <p className="text-sm font-bold text-[#1a8fb5]">
                        {hints.letter}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-[#0f2b3c]">
                          {t("hintsHelp.firstLetter")}
                        </p>
                        <p className="text-xs text-[#3a6b7e]">
                          {t("hintsHelp.firstLetterDesc")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </button>

              <button
                onClick={handleShowOnMap}
                disabled={!hints.letter || !!hints.map || !firstMissingCode || isAdLoading}
                className="flex flex-col gap-3 rounded-xl bg-[#f0a830]/10 p-4 text-left transition-all hover:bg-[#f0a830]/20 active:scale-[0.98] disabled:cursor-default disabled:opacity-100"
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0a830]/20">
                    {!hints.letter ? (
                      <Lock className="h-5 w-5 text-[#f0a830]/50" />
                    ) : (
                      <MapPin className="h-5 w-5 text-[#f0a830]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {hints.map ? (
                      <p className="text-sm font-bold text-[#f0a830]">
                        {t("hintsHelp.mapHintResult")}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-[#0f2b3c]">
                          {t("hintsHelp.showOnMap")}
                        </p>
                        <p className="text-xs text-[#3a6b7e]">
                          {isAdLoading
                            ? t("hintsHelp.loadingAd")
                            : !hints.letter
                              ? t("hintsHelp.unlockFirstLetter")
                              : t("hintsHelp.showOnMapDesc")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </button>

              <button
                onClick={handleFullName}
                disabled={!hints.letter || !hints.map || !!hints.name || !firstMissingCode || isAdLoading}
                className="flex flex-col gap-3 rounded-xl bg-[#6d9581]/10 p-4 text-left transition-all hover:bg-[#6d9581]/20 active:scale-[0.98] disabled:cursor-default disabled:opacity-100"
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6d9581]/20">
                    {!hints.letter || !hints.map ? (
                      <Lock className="h-5 w-5 text-[#6d9581]/50" />
                    ) : (
                      <FileText className="h-5 w-5 text-[#6d9581]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {hints.name ? (
                      <p className="text-sm font-bold text-[#6d9581]">
                        {hints.name}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-[#0f2b3c]">
                          {t("hintsHelp.fullName")}
                        </p>
                        <p className="text-xs text-[#3a6b7e]">
                          {isAdLoading
                            ? t("hintsHelp.loadingAd")
                            : !hints.letter || !hints.map
                              ? t("hintsHelp.unlockMapFirst")
                              : t("hintsHelp.fullNameDesc")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {variant === "help" && (
          <div className="space-y-4 px-1">
            <SheetTitle className="sr-only">{t("helpBubble.howToPlay")}</SheetTitle>
            <div className="flex flex-col gap-4">
              {helpStepsConfig.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0f2b3c]">
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#3a6b7e]">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Replays the spotlight walkthrough on the live screen. The sheet
                has to close first, or the tour would highlight elements sitting
                underneath it. */}
            <button
              onClick={() => {
                onOpenChange(false)
                requestTourReplay("game")
              }}
              className="mt-4 w-full rounded-xl border border-[#b0d8e4] py-3 text-sm font-bold text-[#1a8fb5] transition-colors active:bg-[#e0f4f8]"
            >
              {t("tour.replay")}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-2 w-full rounded-xl bg-[#1a8fb5] py-3 text-sm font-bold text-white transition-colors hover:bg-[#157a9d] active:bg-[#126a8a]"
            >
              {t("hintsHelp.gotIt")}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
