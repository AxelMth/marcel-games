package repositories

import (
	"context"
	"os"
	"testing"
	"time"

	"marcel-games-backend/db"
)

// Ces cas tournent contre un vrai Postgres, parce que la logique testée EST du
// SQL : un COUNT(DISTINCT) sur une clause OR, et un agrégat par joueur. Les
// rejouer en Go ne testerait qu'une réécriture du même raisonnement.
//
//	cd server/wordclimb && docker compose up -d
//	DATABASE_URL="postgresql://root:root@localhost:5432/wordclimb" go test ./internal/repositories/
//
// Sans DATABASE_URL, ils sont sautés — la CI ne monte pas de base.
// TestMain ferme la connexion à la fin du paquet. Sans ça le moteur de requêtes
// que Prisma lance en sous-processus survit au binaire de test, qui rend alors
// « Test I/O incomplete » une minute plus tard — un échec qui n'a rien à voir
// avec les cas eux-mêmes.
func TestMain(m *testing.M) {
	code := m.Run()
	if os.Getenv("DATABASE_URL") != "" {
		db.Disconnect()
	}
	os.Exit(code)
}

func withDB(t *testing.T) (context.Context, func()) {
	t.Helper()
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL absent : test d'intégration sauté")
	}

	// db.Client() est un singleton qui se connecte à DATABASE_URL au premier
	// appel ; il n'y a pas d'injection à faire.
	ctx := context.Background()
	truncate(t, ctx)

	return ctx, func() {
		truncate(t, ctx)
	}
}

func truncate(t *testing.T, ctx context.Context) {
	t.Helper()
	var out []struct{}
	for _, table := range []string{`"LevelHistory"`, `"UserDevice"`, `"User"`} {
		if err := db.Client().Prisma.
			QueryRaw(`DELETE FROM `+table).
			Exec(ctx, &out); err != nil {
			t.Fatalf("purge de %s : %v", table, err)
		}
	}
}

// seed crée un joueur et une partie. Le temps est la donnée qui compte : c'est
// sur elle que tout le classement s'ordonne désormais.
func seed(t *testing.T, ctx context.Context, userID string, mode string, level, timeSpent, attempts int, at time.Time) {
	t.Helper()
	_, err := db.Client().User.CreateOne(
		db.User.DeviceUUID.Set(userID),
		db.User.LastLogin.Set(at),
		db.User.OpenCount.Set(1),
		db.User.ID.Set(userID),
	).Exec(ctx)
	if err != nil {
		// Le joueur peut déjà exister d'un cas précédent de la même fonction.
		t.Logf("utilisateur %s déjà présent : %v", userID, err)
	}

	_, err = db.Client().LevelHistory.CreateOne(
		db.LevelHistory.Level.Set(level),
		db.LevelHistory.Attempts.Set(attempts),
		db.LevelHistory.TimeSpent.Set(timeSpent),
		db.LevelHistory.User.Link(db.User.ID.Equals(userID)),
		db.LevelHistory.HintsUsed.Set(0),
		db.LevelHistory.GameMode.Set(db.GameMode(mode)),
		db.LevelHistory.CreatedAt.Set(at),
	).Exec(ctx)
	if err != nil {
		t.Fatalf("création de la partie de %s : %v", userID, err)
	}
}

func TestClassementParLeTemps(t *testing.T) {
	ctx, done := withDB(t)
	defer done()

	jour := time.Date(2026, 8, 26, 10, 0, 0, 0, time.UTC)

	// « rapide » met 30 s en 9 essais, « lent » met 90 s en 1 seul essai.
	// L'ancien ordre — essais d'abord — classait « lent » devant. Le temps prime
	// désormais.
	seed(t, ctx, "rapide", dailyGameMode, 1, 30, 9, jour)
	seed(t, ctx, "lent", dailyGameMode, 1, 90, 1, jour)

	from, to := dayBounds(jour)

	devantRapide, err := countBetterPlayers(ctx, dailyGameMode, from, to, 30, 9)
	if err != nil {
		t.Fatalf("countBetterPlayers(rapide) : %v", err)
	}
	if rankAmong(devantRapide) != 1 {
		t.Errorf("le plus rapide devrait être 1er, obtenu %d", rankAmong(devantRapide))
	}

	devantLent, err := countBetterPlayers(ctx, dailyGameMode, from, to, 90, 1)
	if err != nil {
		t.Fatalf("countBetterPlayers(lent) : %v", err)
	}
	if rankAmong(devantLent) != 2 {
		t.Errorf("le plus lent devrait être 2e malgré ses essais, obtenu %d", rankAmong(devantLent))
	}
}

func TestLesEssaisDepartagentUneEgalite(t *testing.T) {
	ctx, done := withDB(t)
	defer done()

	jour := time.Date(2026, 8, 26, 10, 0, 0, 0, time.UTC)
	seed(t, ctx, "propre", dailyGameMode, 1, 60, 2, jour)
	seed(t, ctx, "brouillon", dailyGameMode, 1, 60, 8, jour)

	from, to := dayBounds(jour)

	devant, err := countBetterPlayers(ctx, dailyGameMode, from, to, 60, 8)
	if err != nil {
		t.Fatalf("countBetterPlayers : %v", err)
	}
	if rankAmong(devant) != 2 {
		t.Errorf("à temps égal, moins d'essais passe devant : attendu 2, obtenu %d", rankAmong(devant))
	}
}

func TestUnJoueurNeCompteQuUneFoisParJournee(t *testing.T) {
	ctx, done := withDB(t)
	defer done()

	jour := time.Date(2026, 8, 26, 10, 0, 0, 0, time.UTC)
	// Le même joueur a deux parties rapides le même jour. Sans DISTINCT il
	// compterait deux fois et ferait reculer tout le monde d'un rang.
	//
	// Deux NIVEAUX différents, parce que LevelHistory porte un @@unique sur
	// (userId, level, gameMode, wordLadder) : une même partie ne peut pas être
	// enregistrée deux fois. Le doublon par joueur reste possible autrement,
	// d'où le DISTINCT.
	seed(t, ctx, "assidu", dailyGameMode, 1, 10, 1, jour)
	seed(t, ctx, "assidu", dailyGameMode, 2, 20, 1, jour.Add(time.Hour))
	seed(t, ctx, "autre", dailyGameMode, 3, 99, 1, jour)

	from, to := dayBounds(jour)
	devant, err := countBetterPlayers(ctx, dailyGameMode, from, to, 99, 1)
	if err != nil {
		t.Fatalf("countBetterPlayers : %v", err)
	}
	if rankAmong(devant) != 2 {
		t.Errorf("un joueur ne doit compter qu'une fois : attendu 2, obtenu %d", rankAmong(devant))
	}
}

func TestUneAutreJourneeNeComptePas(t *testing.T) {
	ctx, done := withDB(t)
	defer done()

	aujourdhui := time.Date(2026, 8, 26, 10, 0, 0, 0, time.UTC)
	hier := aujourdhui.AddDate(0, 0, -1)

	seed(t, ctx, "hier", dailyGameMode, 1, 5, 1, hier)
	seed(t, ctx, "aujourdhui", dailyGameMode, 1, 50, 1, aujourdhui)

	from, to := dayBounds(aujourdhui)
	devant, err := countBetterPlayers(ctx, dailyGameMode, from, to, 50, 1)
	if err != nil {
		t.Fatalf("countBetterPlayers : %v", err)
	}
	if rankAmong(devant) != 1 {
		t.Errorf("le défi d'hier ne se compare pas à celui d'aujourd'hui : attendu 1, obtenu %d", rankAmong(devant))
	}
}

func TestClassementGlobalSurLeTempsMoyen(t *testing.T) {
	ctx, done := withDB(t)
	defer done()

	j1 := time.Date(2026, 8, 24, 10, 0, 0, 0, time.UTC)
	j2 := time.Date(2026, 8, 25, 10, 0, 0, 0, time.UTC)

	// « regulier » : 20 s et 20 s, moyenne 20.
	// « irregulier » : 10 s et 90 s, moyenne 50 — plus rapide un jour, plus lent
	// en moyenne. Le total départagerait pareil ici, mais la moyenne est ce qui
	// ne pénalise pas celui qui joue plus souvent.
	seed(t, ctx, "regulier", dailyGameMode, 1, 20, 1, j1)
	seed(t, ctx, "regulier", dailyGameMode, 2, 20, 1, j2)
	seed(t, ctx, "irregulier", dailyGameMode, 1, 10, 1, j1)
	seed(t, ctx, "irregulier", dailyGameMode, 2, 90, 1, j2)

	rangRegulier, err := GetUserGlobalDailyRank(ctx, "regulier")
	if err != nil {
		t.Fatalf("GetUserGlobalDailyRank(regulier) : %v", err)
	}
	rangIrregulier, err := GetUserGlobalDailyRank(ctx, "irregulier")
	if err != nil {
		t.Fatalf("GetUserGlobalDailyRank(irregulier) : %v", err)
	}

	if rangRegulier != 1 {
		t.Errorf("la meilleure moyenne devrait être 1re, obtenu %d", rangRegulier)
	}
	if rangIrregulier != 2 {
		t.Errorf("la moins bonne moyenne devrait être 2e, obtenu %d", rangIrregulier)
	}
}

func TestSansDefiJoueLeJoueurNEstPasClasse(t *testing.T) {
	ctx, done := withDB(t)
	defer done()

	// Le garde qui empêche « #1 » pour quelqu'un qui n'a jamais joué : l'agrégat
	// ne contient pas sa ligne, donc zéro joueur devant lui, donc rang 1 si on
	// ne vérifie rien.
	seed(t, ctx, "actif", dailyGameMode, 1, 30, 1, time.Date(2026, 8, 26, 10, 0, 0, 0, time.UTC))

	rang, err := GetUserGlobalDailyRank(ctx, "fantome")
	if err != nil {
		t.Fatalf("GetUserGlobalDailyRank(fantome) : %v", err)
	}
	if rang != 0 {
		t.Errorf("un joueur sans défi doit être non classé (0), obtenu %d", rang)
	}
}
