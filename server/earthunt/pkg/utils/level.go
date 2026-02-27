package utils

import (
	"marcel-games-backend/internal/constants"
	"math/rand"
	"slices"
)

func GetLevelCountryCodesForContinent(level int, continent constants.Continent) []string {
	countriesForContinent := getCountriesForContinent(continent)
	sorted := sortCountriesByArea(countriesForContinent)

	countryCount := getNumberOfCountries(level)
	countrySelectWindow := getCountrySelectWindow(level, len(sorted))
	availableCountries := sorted[:countryCount+countrySelectWindow]

	result := make([]string, 0, countryCount)
	indices := rand.Perm(len(availableCountries))[:countryCount]
	for _, idx := range indices {
		result = append(result, availableCountries[idx].Code)
	}

	return result
}

func GetLevelCountryCodesForLevel(level int) []string {
	sorted := sortCountriesByArea(constants.Countries)

	countryCount := getNumberOfCountries(level)
	countrySelectWindow := getCountrySelectWindow(level, len(sorted))
	availableCountries := sorted[:countryCount+countrySelectWindow]

	result := make([]string, 0, countryCount)
	indices := rand.Perm(len(availableCountries))[:countryCount]
	for _, idx := range indices {
		result = append(result, availableCountries[idx].Code)
	}

	return result
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
	switch {
	case level <= 15:
		return 1
	case level <= 30:
		return rand.Intn(3) + 1
	case level <= 50:
		return rand.Intn(3) + 2
	case level <= 100:
		return rand.Intn(4) + 2
	case level <= 250:
		return rand.Intn(6) + 5
	case level <= 500:
		return rand.Intn(8) + 8
	case level <= 1000:
		return rand.Intn(4) + 12
	default:
		return rand.Intn(6) + 15
	}
}
