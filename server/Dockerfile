ARG GO_VERSION=1
FROM golang:${GO_VERSION}-alpine as builder

WORKDIR /usr/src/app

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application
COPY . ./

# Generate Prisma client
RUN go run github.com/steebchen/prisma-client-go generate

RUN go build -v -o ./run-app ./cmd/api

FROM alpine:latest


WORKDIR /usr/src/app

# Copy the binary and Prisma query engine
COPY --from=builder /usr/src/app/run-app /usr/local/bin

CMD ["run-app"]