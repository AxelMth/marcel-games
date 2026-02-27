package db

import (
	"log"
	"sync"
)

var (
	client *PrismaClient
	once   sync.Once
)

// Client returns the singleton instance of PrismaClient
func Client() *PrismaClient {
	once.Do(func() {
		client = NewClient()
		if err := client.Prisma.Connect(); err != nil {
			log.Fatalf("failed to connect to database: %v", err)
		}
	})
	return client
}

// Disconnect closes the database connection
func Disconnect() {
	if client != nil {
		if err := client.Prisma.Disconnect(); err != nil {
			log.Printf("error disconnecting from database: %v", err)
		}
	}
}

// Initialize explicitly initializes the database connection
func Initialize() error {
	Client() // This will establish the connection if not already done
	return nil
}
