package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
)

// isDebugMode 返回是否为调试模式
func isDebugMode() bool {
	return os.Getenv("GIN_MODE") != "release"
}

func ClerkAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 获取 Token (支持 Bearer Token)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "缺少 Authorization 头"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		// 2. 验证 Token (核心)
		// Clerk SDK 会自动拉取公钥并验证签名、过期时间
		claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
			Token:  token,
			Leeway: time.Minute, // 允许1分钟时钟偏差
		})
		if err != nil {
			// 生产环境不暴露错误详情
			if isDebugMode() {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token 无效", "details": err.Error()})
			} else {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token 无效"})
			}
			return
		}

		// 3. 将用户信息注入上下文，供后续 Controller 使用
		c.Set(ContextKeyUserID, claims.Subject)

		c.Next()
	}
}
