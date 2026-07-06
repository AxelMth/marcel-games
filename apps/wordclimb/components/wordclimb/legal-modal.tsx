"use client"

import { X } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"

// TODO(legal): replace with your real support email and host this policy at a
// public URL (the App Store / Play Store listings both require a privacy policy
// URL). Have the text reviewed before submission — this is an honest starting
// draft, not legal advice.
const CONTACT_EMAIL = "aujoulator1995@gmail.com"
const LAST_UPDATED = "2026-06-30"

interface LegalModalProps {
  onClose: () => void
}

interface Section {
  heading: string
  body: string[]
}

const COPY: Record<"en" | "fr", { privacy: Section[]; terms: Section[] }> = {
  en: {
    privacy: [
      {
        heading: "Who we are",
        body: [
          "WordClimb is a word-ladder game. We do not ask you to create an account and we do not collect your name, email address, or contacts.",
        ],
      },
      {
        heading: "Data we process",
        body: [
          "Anonymous device identifier: a random ID generated on first launch to save your progress and ranking. It is not linked to your real identity.",
          "Gameplay data: levels completed, attempts, time and hints used, sent to our game server to compute rankings.",
          "Device info: brand, model and OS version, used for diagnostics and compatibility.",
          "Anonymous usage analytics help us improve the app.",
        ],
      },
      {
        heading: "No ads, no tracking",
        body: [
          "WordClimb does not show ads and does not track you across other apps or websites.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "Uninstalling the app removes locally stored data.",
        ],
      },
      {
        heading: "Children",
        body: [
          "WordClimb is intended for a general audience and is not directed at children under 13.",
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
          "WordClimb is provided for personal, non-commercial entertainment. Don't misuse the service, attempt to disrupt it, or reverse engineer it.",
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
          "WordClimb est un jeu d'echelles de mots. Aucun compte n'est requis et nous ne collectons ni votre nom, ni votre e-mail, ni vos contacts.",
        ],
      },
      {
        heading: "Donnees traitees",
        body: [
          "Identifiant d'appareil anonyme : un identifiant aleatoire genere au premier lancement pour sauvegarder votre progression et votre classement. Il n'est pas lie a votre identite reelle.",
          "Donnees de jeu : niveaux termines, essais, temps et indices utilises, envoyes a notre serveur pour calculer les classements.",
          "Infos appareil : marque, modele et version de l'OS, a des fins de diagnostic et de compatibilite.",
          "Des statistiques d'usage anonymes nous aident a ameliorer l'application.",
        ],
      },
      {
        heading: "Pas de publicite, pas de suivi",
        body: [
          "WordClimb n'affiche aucune publicite et ne vous suit pas a travers d'autres applications ou sites.",
        ],
      },
      {
        heading: "Vos choix",
        body: ["Desinstaller l'application supprime les donnees stockees localement."],
      },
      {
        heading: "Enfants",
        body: [
          "WordClimb s'adresse a un public general et n'est pas destine aux enfants de moins de 13 ans.",
        ],
      },
      {
        heading: "Contact",
        body: [`Une question ? Ecrivez-nous a ${CONTACT_EMAIL}.`],
      },
    ],
    terms: [
      {
        heading: "Utilisation de l'application",
        body: [
          "WordClimb est fourni a des fins de divertissement personnel et non commercial. N'abusez pas du service, ne tentez pas de le perturber ni de le decompiler.",
        ],
      },
      {
        heading: "Absence de garantie",
        body: [
          "L'application est fournie « en l'etat », sans garantie d'aucune sorte. Les classements et le contenu peuvent evoluer ou etre reinitialises.",
        ],
      },
      {
        heading: "Limitation de responsabilite",
        body: [
          "Dans la limite autorisee par la loi, nous ne sommes pas responsables des dommages indirects ou accessoires lies a votre utilisation de l'application.",
        ],
      },
      {
        heading: "Modifications",
        body: [
          "Nous pouvons mettre a jour ces conditions et la politique de confidentialite. Continuer a utiliser l'application vaut acceptation.",
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
          <h4 className="mb-1 text-sm font-semibold text-[#0A3D62]">{s.heading}</h4>
          {s.body.map((p, i) => (
            <p key={i} className="mb-1 text-sm leading-relaxed text-[#333]">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

export function LegalModal({ onClose }: LegalModalProps) {
  const { locale } = useApp()
  const copy = COPY[locale] ?? COPY.en

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative mx-4 mb-4 flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-[20px] bg-[#F8F8F8] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:mb-0">
        <div className="flex items-center justify-between border-b border-[#E0E0E0] px-5 py-4">
          <h2 className="text-lg font-bold text-[#0A3D62]">{t(locale, "legalOpen")}</h2>
          <button
            onClick={onClose}
            className="text-[#50555C] transition-colors hover:text-[#0A3D62]"
            aria-label={t(locale, "legalClose")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
          <p className="text-xs text-[#50555C]">
            {t(locale, "legalLastUpdated")}: {LAST_UPDATED}
          </p>
          <section>
            <h3 className="mb-2 text-base font-bold text-[#0A3D62]">
              {t(locale, "legalPrivacyTitle")}
            </h3>
            <SectionList sections={copy.privacy} />
          </section>
          <section>
            <h3 className="mb-2 text-base font-bold text-[#0A3D62]">
              {t(locale, "legalTermsTitle")}
            </h3>
            <SectionList sections={copy.terms} />
          </section>
        </div>

        <div className="border-t border-[#E0E0E0] px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#1D70A2] py-2.5 text-sm font-bold text-[#F8F8F8] shadow-sm transition-colors hover:bg-[#165d8a]"
          >
            {t(locale, "legalClose")}
          </button>
        </div>
      </div>
    </div>
  )
}
