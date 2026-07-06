"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marcel-games/ui"
import { useLanguage } from "@/components/language-provider"

// TODO(legal): replace with your real support email and host this policy at a
// public URL (the App Store / Play Store listings both require a privacy policy
// URL). Have the text reviewed before submission — this is an honest starting
// draft, not legal advice.
const CONTACT_EMAIL = "aujoulator1995@gmail.com"
const LAST_UPDATED = "2026-06-30"

interface LegalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Section {
  heading: string
  body: string[]
}

interface LegalCopy {
  privacy: Section[]
  terms: Section[]
}

const COPY: Record<"en" | "fr", LegalCopy> = {
  en: {
    privacy: [
      {
        heading: "Who we are",
        body: [
          "EartHunt is a geography game. We do not ask you to create an account and we do not collect your name, email address, or contacts.",
        ],
      },
      {
        heading: "Data we process",
        body: [
          "Anonymous device identifier: a random ID generated on first launch to save your game progress and ranking. It is not linked to your real identity.",
          "Gameplay data: levels completed, scores, time and hints used, sent to our game server to compute rankings.",
          "Device info: brand, model and OS version, used for diagnostics and compatibility.",
        ],
      },
      {
        heading: "Advertising",
        body: [
          "We show ads through Google AdMob. On iOS we ask for your permission (App Tracking Transparency) before using your device's advertising identifier for personalized ads. If you decline, you still see ads, but they are not personalized.",
          "Google may process data as described in Google's Privacy Policy.",
        ],
      },
      {
        heading: "Maps & analytics",
        body: [
          "Maps are provided by Mapbox. Anonymous usage analytics help us improve the app.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can reset the advertising identifier or revoke tracking permission in your device settings at any time. Uninstalling the app removes locally stored data.",
        ],
      },
      {
        heading: "Children",
        body: [
          "EartHunt is intended for a general audience and is not directed at children under 13.",
        ],
      },
      {
        heading: "Contact",
        body: [`Questions? Contact us at ${CONTACT_EMAIL}.`],
      },
    ],
    terms: [
      {
        heading: "Using the app",
        body: [
          "EartHunt is provided for personal, non-commercial entertainment. Don't misuse the service, attempt to disrupt it, or reverse engineer it.",
        ],
      },
      {
        heading: "No warranty",
        body: [
          "The app is provided \"as is\", without warranties of any kind. Rankings and game content may change or be reset.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "To the extent permitted by law, we are not liable for any indirect or incidental damages arising from your use of the app.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms and the privacy policy. Continued use after changes means you accept them.",
        ],
      },
    ],
  },
  fr: {
    privacy: [
      {
        heading: "Qui sommes-nous",
        body: [
          "EartHunt est un jeu de géographie. Aucun compte n'est requis et nous ne collectons ni votre nom, ni votre e-mail, ni vos contacts.",
        ],
      },
      {
        heading: "Données traitées",
        body: [
          "Identifiant d'appareil anonyme : un identifiant aléatoire généré au premier lancement pour sauvegarder votre progression et votre classement. Il n'est pas lié à votre identité réelle.",
          "Données de jeu : niveaux terminés, scores, temps et indices utilisés, envoyés à notre serveur pour calculer les classements.",
          "Infos appareil : marque, modèle et version de l'OS, à des fins de diagnostic et de compatibilité.",
        ],
      },
      {
        heading: "Publicité",
        body: [
          "Nous affichons des publicités via Google AdMob. Sur iOS, nous demandons votre autorisation (App Tracking Transparency) avant d'utiliser l'identifiant publicitaire de votre appareil pour des publicités personnalisées. Si vous refusez, vous voyez toujours des publicités, mais non personnalisées.",
          "Google peut traiter des données comme décrit dans la politique de confidentialité de Google.",
        ],
      },
      {
        heading: "Cartes & analyse",
        body: [
          "Les cartes sont fournies par Mapbox. Des statistiques d'usage anonymes nous aident à améliorer l'application.",
        ],
      },
      {
        heading: "Vos choix",
        body: [
          "Vous pouvez réinitialiser l'identifiant publicitaire ou révoquer l'autorisation de suivi dans les réglages de votre appareil à tout moment. Désinstaller l'application supprime les données stockées localement.",
        ],
      },
      {
        heading: "Enfants",
        body: [
          "EartHunt s'adresse à un public général et n'est pas destiné aux enfants de moins de 13 ans.",
        ],
      },
      {
        heading: "Contact",
        body: [`Une question ? Écrivez-nous à ${CONTACT_EMAIL}.`],
      },
    ],
    terms: [
      {
        heading: "Utilisation de l'application",
        body: [
          "EartHunt est fourni à des fins de divertissement personnel et non commercial. N'abusez pas du service, ne tentez pas de le perturber ni de le décompiler.",
        ],
      },
      {
        heading: "Absence de garantie",
        body: [
          "L'application est fournie « en l'état », sans garantie d'aucune sorte. Les classements et le contenu peuvent évoluer ou être réinitialisés.",
        ],
      },
      {
        heading: "Limitation de responsabilité",
        body: [
          "Dans la limite autorisée par la loi, nous ne sommes pas responsables des dommages indirects ou accessoires liés à votre utilisation de l'application.",
        ],
      },
      {
        heading: "Modifications",
        body: [
          "Nous pouvons mettre à jour ces conditions et la politique de confidentialité. Continuer à utiliser l'application vaut acceptation.",
        ],
      },
    ],
  },
}

function SectionList({ sections }: { sections: Section[] }) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((s) => (
        <div key={s.heading}>
          <h4 className="mb-1 text-sm font-semibold text-[#0f2b3c]">
            {s.heading}
          </h4>
          {s.body.map((p, i) => (
            <p key={i} className="mb-1 text-sm leading-relaxed text-[#0f2b3c]/80">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

export function LegalModal({ open, onOpenChange }: LegalModalProps) {
  const { lang, t } = useLanguage()
  const copy = COPY[lang] ?? COPY.en

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0f2b3c]">
            {t("legal.open")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 overflow-y-auto pr-1">
          <p className="text-xs text-[#0f2b3c]/60">
            {t("legal.lastUpdated")}: {LAST_UPDATED}
          </p>
          <section>
            <h3 className="mb-2 text-base font-bold text-[#0f2b3c]">
              {t("legal.privacyTitle")}
            </h3>
            <SectionList sections={copy.privacy} />
          </section>
          <section>
            <h3 className="mb-2 text-base font-bold text-[#0f2b3c]">
              {t("legal.termsTitle")}
            </h3>
            <SectionList sections={copy.terms} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
