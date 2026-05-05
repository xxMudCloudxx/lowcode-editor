package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"lowercode-go-server/api/controller"
	"lowercode-go-server/api/route"
	"lowercode-go-server/bootstrap"
	"lowercode-go-server/internal/ws"
	"lowercode-go-server/repository"
	"lowercode-go-server/usecase"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("[Server] LowCode Go Server 启动中...")

	// 加载环境变量
	env := bootstrap.LoadEnv()

	// 初始化 Clerk
	bootstrap.InitClerk()

	// 连接数据库
	db := bootstrap.NewDatabase(env.DatabaseURL)

	// 依赖注入 - Repository 层
	pageRepo := repository.NewPageRepository(db)
	userRepo := repository.NewUserRepository(db)

	// WebSocket Hub
	hub := ws.NewHub(pageRepo.(ws.PageService))

	// 依赖注入 - UseCase 层
	pageUseCase := usecase.NewPageUseCase(pageRepo, userRepo, hub)

	// 依赖注入 - Controller 层
	pageController := controller.NewPageController(pageUseCase)
	wsHandler := controller.NewWSHandler(hub, userRepo, []string{
		"https://xxmudcloudxx.github.io",
	})
	webhookController := controller.NewWebhookController(userRepo, env.WebhookSecret)

	// 启动 Hub 事件循环
	go hub.Run()

	// 配置 Gin 路由
	router := gin.Default()

	// CORS 配置
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://xxmudcloudxx.github.io", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 设置路由
	route.Setup(router, &route.Dependencies{
		PageController:    pageController,
		WSHandler:         wsHandler,
		WebhookController: webhookController,
	})

	// 启动 HTTP 服务
	srv := &http.Server{
		Addr:    ":" + env.Port,
		Handler: router,
	}

	go func() {
		log.Printf("[Server] 服务已启动: http://localhost:%s", env.Port)
		log.Printf("[Server] API 端点:")
		log.Printf("   GET  /health              - 健康检查")
		log.Printf("   GET  /api/pages/:pageId   - 获取页面")
		log.Printf("   POST /api/pages           - 创建页面")
		log.Printf("   DELETE /api/pages/:pageId - 删除页面")
		log.Printf("   GET  /ws?pageId=xxx&token=xxx - WebSocket 连接")
		log.Printf("   POST /webhook/clerk       - Clerk Webhook")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Server] 服务启动失败: %v", err)
		}
	}()

	// 优雅停机
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[Server] 收到停机信号，正在优雅关闭...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[Server] 服务强制关闭: %v", err)
	}

	log.Println("[Server] 服务已安全停止")
}
