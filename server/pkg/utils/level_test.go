package utils

import (
	"testing"
)

func Test_CountryCodesAreReturned(t *testing.T) {
	// Arrange
	level := 1000

	// Act
	result := GetLevelCountryCodesForLevel(level)

	for _, code := range result {
		if len(code) != 2 {
			t.Errorf("Expected country code to be 2 characters long, but got %d", len(code))
		}
	}
}

func Test_CorrectNumberOfCountriesAreReturned_15(t *testing.T) {
	// Arrange
	level := 15
	expected := 1

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) != expected {
		t.Errorf("Expected %d countries, but got %d", expected, len(result))
	}
}

func Test_CorrectNumberOfCountriesAreReturned_30(t *testing.T) {
	// Arrange
	level := 30
	min := 1
	max := 3

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) < min && len(result) > max {
		t.Errorf("Expected from %d to %d countries, but got %d", min, max, len(result))
	}
}

func Test_CorrectNumberOfCountriesAreReturned_50(t *testing.T) {
	// Arrange
	level := 50
	min := 2
	max := 4

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) < min && len(result) > max {
		t.Errorf("Expected from %d to %d countries, but got %d", min, max, len(result))
	}
}

func Test_CorrectNumberOfCountriesAreReturned_100(t *testing.T) {
	// Arrange
	level := 100
	min := 2
	max := 5

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) < min && len(result) > max {
		t.Errorf("Expected from %d to %d countries, but got %d", min, max, len(result))
	}
}

func Test_CorrectNumberOfCountriesAreReturned_250(t *testing.T) {
	// Arrange
	level := 250
	min := 5
	max := 10

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) < min && len(result) > max {
		t.Errorf("Expected from %d to %d countries, but got %d", min, max, len(result))
	}
}

func Test_CorrectNumberOfCountriesAreReturned_500(t *testing.T) {
	// Arrange
	level := 500
	min := 8
	max := 16

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) < min && len(result) > max {
		t.Errorf("Expected from %d to %d countries, but got %d", min, max, len(result))
	}
}

func Test_CorrectNumberOfCountriesAreReturned_1000(t *testing.T) {
	// Arrange
	level := 1000
	min := 12
	max := 15

	// Act
	result := GetLevelCountryCodesForLevel(level)

	// Assert
	if len(result) < min && len(result) > max {
		t.Errorf("Expected from %d to %d countries, but got %d", min, max, len(result))
	}
}
