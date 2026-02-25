package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const userIDKey = "userID"
const usernameKey = "username"

// JWTAuth validates a Bearer token and injects claims into the context.
func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or malformed token"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		c.Set(userIDKey, claims["sub"])
		c.Set(usernameKey, claims["username"])
		c.Next()
	}
}

// GetUserID returns the authenticated user's ID from the context.
func GetUserID(c *gin.Context) string {
	v, _ := c.Get(userIDKey)
	id, _ := v.(string)
	return id
}

// GetUsername returns the authenticated user's username from the context.
func GetUsername(c *gin.Context) string {
	v, _ := c.Get(usernameKey)
	u, _ := v.(string)
	return u
}
