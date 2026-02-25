// Package middleware provides Gin middleware used by the API server.
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/marcelgames/marcel-games-api/internal/database"
)

// contextKey is an unexported type for context keys in this package.
type contextKey string

const DBKey contextKey = "db"

// AppDatabases holds references to both app databases.
type AppDatabases struct {
	Earthunt *database.DB
	Wordclimb *database.DB
	EarthuntHost string
	WordclimbHost string
}

// AppSelector inspects the Host header and injects the correct *database.DB
// into the Gin context under the key "db".
//
// Requests whose host does not match either app are rejected with 400.
func AppSelector(dbs *AppDatabases) gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host

		// Strip port suffix if present (e.g. "localhost:8080" → "localhost")
		for i := len(host) - 1; i >= 0; i-- {
			if host[i] == ':' {
				host = host[:i]
				break
			}
		}

		switch host {
		case dbs.EarthuntHost:
			c.Set(string(DBKey), dbs.Earthunt)
		case dbs.WordclimbHost:
			c.Set(string(DBKey), dbs.Wordclimb)
		default:
			// In development (localhost / 127.0.0.1) default to Earthunt.
			if host == "localhost" || host == "127.0.0.1" {
				c.Set(string(DBKey), dbs.Earthunt)
			} else {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
					"error": "unknown host: " + host,
				})
				return
			}
		}

		c.Next()
	}
}

// GetDB retrieves the injected *database.DB from the Gin context.
func GetDB(c *gin.Context) *database.DB {
	v, _ := c.Get(string(DBKey))
	db, _ := v.(*database.DB)
	return db
}
