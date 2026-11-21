# WordClimb — fiche App Store Connect (version 1.0.0, build 3)

À coller dans App Store Connect. Les limites de caractères sont celles d'Apple.

## Informations de l'app

| Champ | Valeur |
|---|---|
| Nom (30 max) | WordClimb |
| Sous-titre (30 max) | Une lettre, un mot, un barreau |
| Identifiant | com.marcelgames.wordclimb |
| Catégorie principale | Jeux › Mots |
| Catégorie secondaire | Jeux › Réflexion |
| Langue principale | Français |
| Prix | Gratuit |
| URL de confidentialité | https://axelmth.github.io/marcel-games/wordclimb-privacy-and-terms |
| URL d'assistance | https://axelmth.github.io/marcel-games/support |
| Copyright | 2026 Axel Mathieu |

## Texte promotionnel (170 max)

Change une lettre pour passer d'un mot au suivant et grimpe l'échelle jusqu'à l'arrivée. 1 500 niveaux en français, sans compte ni publicité.

## Description

WordClimb est un jeu d'échelles de mots.

Tu pars d'un mot, tu dois en atteindre un autre. À chaque barreau, tu changes une seule lettre pour former un nouveau mot. Trouve tous les mots manquants et l'échelle est gravie.

• 1 500 niveaux en français, plus de 1 400 en anglais
• Des mots de 4 à 6 lettres, de plus en plus longs
• Jusqu'à trois étoiles par niveau, selon ta précision
• Un clavier intégré, pensé pour jouer à une main
• Ta progression reste sur ton appareil
• Aucun compte, aucune publicité, aucun achat

L'app choisit le français ou l'anglais selon la langue de ton iPhone.

## Mots-clés (100 max, séparés par des virgules)

mots,échelle,lettres,puzzle,vocabulaire,réflexion,anagramme,cérébral,français,casse-tête

## Nouveautés de cette version

Première version de WordClimb.

## Captures d'écran (iPhone 6,9", 1320 × 2868)

À envoyer, dans cet ordre, depuis `store-assets/ios/6.9/fr/fiche/` :

1. `01-change-une-lettre.png` — la règle, sur une partie en cours
2. `02-trois-etoiles.png` — la récompense, sur un niveau terminé
3. `03-sans-pub.png` — le volume et l'absence de pub, sur l'accueil

Les captures sans habillage sont dans `store-assets/ios/6.9/fr/brut/`.

Apple en demande au moins une et en accepte dix. Les autres tailles d'iPhone sont déduites de celle-ci.

## Confidentialité de l'app

Réponse au questionnaire : **Données collectées, non liées à l'utilisateur, sans suivi**.

| Type de données | Finalité | Lié à l'identité | Suivi |
| --- | --- | --- | --- |
| Identifiants → Identifiant de l'appareil (ID aléatoire créé par l'app) | Fonctionnalité de l'app | Non | Non |
| Données d'utilisation → Interactions avec le produit (niveaux finis, essais, temps, indices) | Fonctionnalité de l'app | Non | Non |
| Diagnostics → Autres données de diagnostic (marque, modèle, version d'iOS) | Fonctionnalité de l'app | Non | Non |

Depuis le build 12, l'app envoie ces données à `wordclimb-api.fly.dev` pour conserver la progression. Le build 11 ne fait aucun appel réseau : si c'est lui qui est soumis, la réponse reste « Données non collectées ».

## Classification par âge

Répondre « Non » ou « Aucun » à toutes les questions de contenu. Résultat attendu : 4+.

## Conformité export

`ITSAppUsesNonExemptEncryption` vaut `false` dans le build : aucune question ne sera posée à l'envoi.

## Notes pour App Review

WordClimb is a word-ladder puzzle game. No account or sign-in is required and the app works fully offline: it makes no network requests.

How to play: tap "Jouer" (Play) on the home screen. Type the next word with the in-game keyboard; each word differs from the previous one by exactly one letter. A row is checked automatically once it is full. For level 1 in French, the answers are BETE then BUTE; in English, WARD then WORD.

The app has no ads, no in-app purchases and collects no data. This build replaces an earlier Capacitor shell that used the same bundle identifier and was never released.

Contact: ceo@axelmathi.eu

## Avant d'envoyer en review

- [ ] Accepter le nouvel accord développeur sur developer.apple.com (bloque l'export aujourd'hui)
- [ ] Exporter et envoyer le build 3
- [ ] Sélectionner le build 3 sur la version 1.0.0
- [ ] Vérifier que le contrat « Apps gratuites » est actif
- [ ] Déclarer le statut de commerçant pour l'Union européenne
- [ ] Tester le build sur un vrai iPhone via TestFlight
