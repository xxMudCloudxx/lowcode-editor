package bootstrap

import (
	"log"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
)

func InitClerk() {
	secret := os.Getenv("CLERK_SECRET_KEY")
	if secret == "" {
		log.Fatal("未找到CLERK_SECRET_KEY")
	}
	clerk.SetKey(secret)

	log.Println("Clerk初始化成功")
}
