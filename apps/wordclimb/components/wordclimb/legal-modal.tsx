"use client"

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marcel-games/ui"
import { useApp } from "@/lib/app-context"
import { t } from "@/lib/i18n"

// The same policy is published at legal/wordclimb-privacy-and-terms.md and
// hosted via the legal-pages workflow; both store listings require that public
// URL. Have the text reviewed before submission — it is an honest starting
// draft, not legal advice.
const CONTACT_EMAIL = "ceo@axelmathi.eu"
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
        heading: "Advertising",
        body: [
          "WordClimb shows no ads and uses no advertising identifier. We do not track you across apps or websites.",
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
      {
        heading: "Credits",
        body: [
          "Word definitions are derived from Wiktionary (en.wiktionary.org) and Wiktionnaire (fr.wiktionary.org), used under the Creative Commons Attribution-ShareAlike licence (creativecommons.org/licenses/by-sa/4.0). Entries were extracted and shortened to a single sense.",
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
        heading: "Publicite",
        body: [
          "WordClimb n'affiche aucune publicite et n'utilise aucun identifiant publicitaire. Nous ne vous suivons pas d'une application ou d'un site a l'autre.",
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
      {
        heading: "Credits",
        body: [
          "Les definitions des mots proviennent du Wiktionnaire (fr.wiktionary.org) et de Wiktionary (en.wiktionary.org), reutilisees sous licence Creative Commons Attribution - Partage dans les memes conditions (creativecommons.org/licenses/by-sa/4.0). Les entrees ont ete extraites et reduites a un seul sens.",
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/*
        grid-rows-[auto_minmax(0,1fr)_auto] est ce qui rend le texte long
        atteignable. Les pistes d'un grid sont en `auto` par défaut, donc
        dimensionnées par leur contenu, et une piste `auto` ne se compresse
        jamais sous son max-content : un max-h posé dessus ne rétrécit rien, il
        rogne. Le overflow-y-auto interne n'avait alors aucune hauteur
        contrainte et ne déclenchait aucun ascenseur — c'est exactement ce qui
        coupait les CGU d'earthunt, e-mail de contact compris.
      */}
      <DialogContent className="grid max-h-[85vh] max-w-sm grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[20px] border-0 bg-[#F8F8F8] p-0">
        <DialogHeader className="border-b border-[#E0E0E0] px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-[#0A3D62]">
            {t(locale, "legalOpen")}
          </DialogTitle>
        </DialogHeader>

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
          <Button size="lg" className="w-full" onClick={onClose}>
            {t(locale, "legalClose")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
