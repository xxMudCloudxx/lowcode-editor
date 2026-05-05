package route

import (
	"lowercode-go-server/api/controller"
	"lowercode-go-server/api/middleware"

	"github.com/gin-gonic/gin"
)

// Dependencies 路由依赖注入结构
type Dependencies struct {
	PageController    *controller.PageController
	WSHandler         *controller.WSHandler
	WebhookController *controller.WebhookController
}

// Setup 配置所有路由
func Setup(router *gin.Engine, deps *Dependencies) {
	// --- 公开路由 ---

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "lowcode-go-server",
		})
	})

	// Clerk Webhook（使用签名验证，不使用 JWT）
	router.POST("/webhook/clerk", deps.WebhookController.HandleClerkWebhook)

	// --- WebSocket 路由 ---
	// WebSocket 自行在 Handler 中验证 Token
	router.GET("/ws", deps.WSHandler.HandleWS)

	// --- API 路由（需要 Clerk JWT 认证）---
	api := router.Group("/api")
	api.Use(middleware.ClerkAuth())
	{
		// 页面 CRUD
		api.GET("/pages/:pageId", deps.PageController.GetPage)
		api.POST("/pages", deps.PageController.CreatePage)
		api.DELETE("/pages/:pageId", deps.PageController.DeletePage)
	}
}
