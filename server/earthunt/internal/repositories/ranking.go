package repositories

import (
	"context"
	"time"

	"marcel-games-backend/db"
)

// Le classement répond à « qui a fini le plus vite ». Le temps est donc la clé
// primaire, croissante, et le nombre d'essais ne fait que départager deux
// joueurs à égalité de temps.
//
// L'ordre précédent était l'inverse — essais d'abord, temps en second — ce qui
// classait devant un joueur lent mais chanceux plutôt que le plus rapide, alors
// que les deux écrans qui l'affichent parlent de « rang du jour » et de « rang
// global » sur un jeu qui chronomètre chaque partie.
//
// Ce fichier est volontairement identique dans les deux serveurs, au nom de la
// table près : les deux jeux doivent classer de la même façon.

// dailyGameMode est la valeur stockée pour le défi du jour.
const dailyGameMode = "LEVEL_OF_THE_DAY"

// dayRankQuery classe une partie parmi celles du même jour.
const rankQuery = `
SELECT COUNT(DISTINCT "userId")::int AS "count"
FROM "LevelHistory"
WHERE "gameMode" = $1::"GameMode"
  AND "createdAt" >= $2
  AND "createdAt" < $3
  AND (
    "timeSpent" < $4
    OR ("timeSpent" = $4 AND "attempts" < $5)
  )
`

type rankCount struct {
	Count int `json:"count"`
}

// countBetterPlayers compte les joueurs DISTINCTS qui ont fait mieux que
// (timeSpent, attempts) sur la fenêtre donnée.
//
// Le comptage se fait en base plutôt qu'en Go. L'implémentation précédente
// lançait deux FindMany, rapatriait chaque ligne correspondante — donc une
// ligne par partie de chaque joueur — et dédoublonnait en mémoire. Le coût
// grandissait avec la population, pour un résultat qui tient dans un entier.
//
// DISTINCT est nécessaire et pas cosmétique : un joueur peut avoir plusieurs
// lignes sur la même fenêtre, et sans lui il compterait plusieurs fois.
func countBetterPlayers(
	ctx context.Context,
	gameMode string,
	from, to time.Time,
	timeSpent, attempts int,
) (int, error) {
	var rows []rankCount
	err := db.Client().Prisma.
		QueryRaw(rankQuery, gameMode, from, to, timeSpent, attempts).
		Exec(ctx, &rows)
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	return rows[0].Count, nil
}

// rankAmong traduit un décompte en rang affichable : le meilleur joueur n'a
// personne devant lui et vaut 1.
func rankAmong(better int) int {
	return better + 1
}

// dayBounds renvoie la journée civile qui contient t, dans son propre fuseau.
// Le défi du jour se classe par journée : deux parties du même jour sont
// comparables, deux parties de jours différents ne le sont pas.
func dayBounds(t time.Time) (time.Time, time.Time) {
	start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	return start, start.Add(24 * time.Hour)
}

// levelRankQuery classe une partie parmi celles du même niveau, du même mode et
// du même continent.
//
// C'est le seul endroit où ce fichier s'écarte de son jumeau côté wordclimb :
// l'ordre est identique — le temps d'abord — mais la PORTÉE diffère, parce que
// le niveau 12 d'Europe n'est pas le niveau 12 d'Asie, alors qu'une échelle de
// mots n'a pas de découpage équivalent.
const levelRankQuery = `
SELECT COUNT(DISTINCT "userId")::int AS "count"
FROM "LevelHistory"
WHERE "gameMode" = $1::"GameMode"
  AND "continent" = $2::"Continent"
  AND "level" = $3
  AND (
    "timeSpent" < $4
    OR ("timeSpent" = $4 AND "attempts" < $5)
  )
`

// globalDailyRankQuery classe un joueur parmi tous ceux qui ont joué des défis
// du jour, sur son temps MOYEN.
//
// La moyenne plutôt que le total : le total pénalise celui qui joue beaucoup, ce
// qui n'a rien à voir avec le fait d'être rapide.
//
// Cette requête remplace un calcul qui chargeait TOUS les utilisateurs, puis
// pour chacun tout son historique de défis, puis lançait deux requêtes par jour
// et par joueur — de l'ordre du produit des deux populations, pour un entier.
const globalDailyRankQuery = `
WITH par_joueur AS (
  SELECT "userId",
         AVG("timeSpent")::float8 AS temps_moyen,
         AVG("attempts")::float8  AS essais_moyens
  FROM "LevelHistory"
  WHERE "gameMode" = $1::"GameMode"
  GROUP BY "userId"
)
SELECT COUNT(*)::int AS "count"
FROM par_joueur autre, par_joueur moi
WHERE moi."userId" = $2
  AND autre."userId" <> $2
  AND (
    autre.temps_moyen < moi.temps_moyen
    OR (autre.temps_moyen = moi.temps_moyen AND autre.essais_moyens < moi.essais_moyens)
  )
`

// countBetterOnLevel compte les joueurs distincts plus rapides sur un niveau donné.
func countBetterOnLevel(
	ctx context.Context,
	gameMode string,
	continent string,
	level int,
	timeSpent, attempts int,
) (int, error) {
	var rows []rankCount
	err := db.Client().Prisma.
		QueryRaw(levelRankQuery, gameMode, continent, level, timeSpent, attempts).
		Exec(ctx, &rows)
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	return rows[0].Count, nil
}

// countBetterGlobally compte les joueurs dont la moyenne sur les défis du jour
// bat celle de userID. Renvoie 0 si le joueur n'a aucun défi à son actif : la
// requête ne trouve alors pas sa ligne, et il n'est pas classé.
func countBetterGlobally(ctx context.Context, userID string) (int, error) {
	var rows []rankCount
	err := db.Client().Prisma.
		QueryRaw(globalDailyRankQuery, dailyGameMode, userID).
		Exec(ctx, &rows)
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}
	return rows[0].Count, nil
}
