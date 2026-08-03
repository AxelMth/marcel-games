package utils

import (
	"marcel-games-backend/internal/constants"
	"math/rand"
	"slices"
)

func GetLevelCountryCodesForContinent(level int, continent constants.Continent) []string {
	countriesForContinent := getCountriesForContinent(continent)
	sorted := sortCountriesByArea(countriesForContinent)

	return pickCountryCodes(sorted, level, nil)
}

func GetLevelCountryCodesForLevel(level int) []string {
	return GetLevelCountryCodesForLevelWithRand(level, nil)
}

// GetLevelCountryCodesForLevelWithRand draws the level from a caller-supplied
// generator, so a reproducible level can be built without seeding the global
// source — which is shared with every other request in flight.
// A nil generator falls back to the package-level source.
func GetLevelCountryCodesForLevelWithRand(level int, r *rand.Rand) []string {
	sorted := sortCountriesByArea(constants.Countries)

	return pickCountryCodes(sorted, level, r)
}

// pickCountryCodes draws a level's countries from a pool sorted hardest-last.
//
// Both the number of countries and the window they are drawn from grow with the
// level, and neither was clamped to the pool: Oceania holds seven countries, so
// from level 101 the slice bound exceeded it and the request panicked — a 500
// that also fired from FinishLevelHandler, after the level had been recorded,
// leaving that continent unplayable for the player. The world pool ran out the
// same way past level 1000, and an unknown continent gives an empty pool at
// every level.
func pickCountryCodes(sorted []constants.Country, level int, r *rand.Rand) []string {
	if len(sorted) == 0 {
		return []string{}
	}

	countryCount := min(getNumberOfCountriesWithRand(level, r), len(sorted))
	window := min(countryCount+getCountrySelectWindow(level, len(sorted)), len(sorted))
	availableCountries := sorted[:window]

	result := make([]string, 0, countryCount)
	for _, idx := range permutation(r, len(availableCountries))[:countryCount] {
		result = append(result, availableCountries[idx].Code)
	}

	return result
}

func permutation(r *rand.Rand, n int) []int {
	if r == nil {
		return rand.Perm(n)
	}
	return r.Perm(n)
}

func getCountriesForContinent(continent constants.Continent) []constants.Country {
	result := make([]constants.Country, 0)
	for _, country := range constants.Countries {
		if country.Continent == continent {
			result = append(result, country)
		}
	}
	return result
}

func sortCountriesByArea(countries []constants.Country) []constants.Country {
	sorted := make([]constants.Country, len(countries))
	copy(sorted, countries)
	slices.SortFunc(sorted, func(i, j constants.Country) int {
		if i.Area > j.Area {
			return -1
		}
		if i.Area < j.Area {
			return 1
		}
		return 0
	})
	return sorted
}

func getCountrySelectWindow(level int, numberOfCountries int) int {
	switch {
	case level <= 15:
		return int(float64(numberOfCountries) * 0.1)
	case level <= 30:
		return int(float64(numberOfCountries) * 0.2)
	case level <= 50:
		return int(float64(numberOfCountries) * 0.3)
	case level <= 100:
		return int(float64(numberOfCountries) * 0.4)
	case level <= 250:
		return int(float64(numberOfCountries) * 0.6)
	case level <= 500:
		return int(float64(numberOfCountries) * 0.75)
	case level <= 1000:
		return int(float64(numberOfCountries) * 0.85)
	default:
		return numberOfCountries
	}
}

func getNumberOfCountries(level int) int {
	return getNumberOfCountriesWithRand(level, nil)
}

// The count is drawn as well as the countries, so a caller after a reproducible
// level has to supply the generator here too — passing it only to the shuffle
// left the size random.
func getNumberOfCountriesWithRand(level int, r *rand.Rand) int {
	switch {
	case level <= 15:
		return 1
	case level <= 30:
		return intn(r, 3) + 1
	case level <= 50:
		return intn(r, 3) + 2
	case level <= 100:
		return intn(r, 4) + 2
	case level <= 250:
		return intn(r, 6) + 5
	case level <= 500:
		return intn(r, 8) + 8
	case level <= 1000:
		return intn(r, 4) + 12
	default:
		return intn(r, 6) + 15
	}
}

func intn(r *rand.Rand, n int) int {
	if r == nil {
		return rand.Intn(n)
	}
	return r.Intn(n)
}
