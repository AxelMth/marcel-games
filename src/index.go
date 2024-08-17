package main

import (
    "context"
    "fmt"

    "prisma/db"
)

func main() {
  users := run()
  fmt.Println(users)
}

func run() ([]db.UserModel) {
    client := db.NewClient()
    var err error
    if err = client.Prisma.Connect(); err != nil {
      panic(err)
    }
   
    defer func() {
      if err := client.Prisma.Disconnect(); err != nil {
        panic(err)
      }
    }()
   
    ctx := context.Background()
   
    users, err := client.User.FindMany().Exec(ctx)

    if err != nil {
        panic(err)
    }

    return users
}