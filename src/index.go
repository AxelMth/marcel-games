package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strconv"
)

// Mock database for user levels
var userLevels = map[string]int{
    "user1": 1,
    "user2": 2,
    "user3": 3,
}

// Handler function for the root endpoint
func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
}

// Handler function for the next-level endpoint
func nextLevelHandler(w http.ResponseWriter, r *http.Request) {
    user := r.URL.Query().Get("user")
    currentLevel, exists := userLevels[user]
    if !exists {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }
    nextLevel := currentLevel + 1
    response := map[string]int{"next_level": nextLevel}
    json.NewEncoder(w).Encode(response)
}

// Handler function for the rank endpoint
func rankHandler(w http.ResponseWriter, r *http.Request) {
    attemptsStr := r.URL.Query().Get("attempts")
    timeSpentStr := r.URL.Query().Get("time_spent")

    attempts, err := strconv.Atoi(attemptsStr)
    if err != nil {
        http.Error(w, "Invalid attempts parameter", http.StatusBadRequest)
        return
    }

    timeSpent, err := strconv.Atoi(timeSpentStr)
    if err != nil {
        http.Error(w, "Invalid time_spent parameter", http.StatusBadRequest)
        return
    }

    rank := calculateRank(attempts, timeSpent)
    response := map[string]int{"rank": rank}
    json.NewEncoder(w).Encode(response)
}

// Mock function to calculate rank based on attempts and time spent
func calculateRank(attempts, timeSpent int) int {
    // Simple rank calculation for demonstration purposes
    return 100 - (attempts * 2) - (timeSpent / 10)
}

func main() {
    // Register the handler functions for the endpoints
    http.HandleFunc("/", helloHandler)
    http.HandleFunc("/next-level", nextLevelHandler)
    http.HandleFunc("/rank", rankHandler)

    // Start the HTTP server on port 8080
    fmt.Println("Starting server at port 8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatal(err)
    }
}