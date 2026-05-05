package bootstrap

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Env 环境变量配置结构
type Env struct {
	DatabaseURL    string // PostgreSQL 连接字符串
	ClerkSecretKey string // Clerk API 密钥
	WebhookSecret  string // Clerk Webhook 签名密钥
	Port           string // 服务端口
}

// LoadEnv 加载环境变量
// 开发环境从 .env 文件加载，生产环境从系统环境变量读取
func LoadEnv() *Env {
	if err := godotenv.Load(); err != nil {
		log.Println("[Env] .env 文件未找到，将使用系统环境变量")
	}

	env := &Env{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		ClerkSecretKey: os.Getenv("CLERK_SECRET_KEY"),
		WebhookSecret:  os.Getenv("CLERK_WEBHOOK_SECRET"),
		Port:           os.Getenv("PORT"),
	}

	// 默认端口
	if env.Port == "" {
		env.Port = "8080"
	}

	// 必需变量检查
	if env.DatabaseURL == "" {
		log.Fatal("[Env] 缺少必需环境变量: DATABASE_URL")
	}

	log.Printf("[Env] 环境变量加载完成, 端口: %s", env.Port)
	return env
}
