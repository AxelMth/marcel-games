module marcel-games

go 1.23.0

require (
	github.com/steebchen/prisma-client-go v0.38.0
	prisma/db v0.0.0-00010101000000-000000000000
)

require (
	github.com/joho/godotenv v1.5.1 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
)

replace prisma/db => ./prisma/db
