package controller

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	domainErrors "lowercode-go-server/domain/errors"
	domainRepo "lowercode-go-server/domain/repository"
	"lowercode-go-server/internal/ws"

	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WSHandler WebSocket 连接处理器
type WSHandler struct {
	hub      *ws.Hub
	userRepo domainRepo.UserRepository
	upgrader websocket.Upgrader
}

// NewWSHandler 创建 WSHandler 实例
func NewWSHandler(hub *ws.Hub, userRepo domainRepo.UserRepository, allowedOrigins []string) *WSHandler {
	return &WSHandler{
		hub:      hub,
		userRepo: userRepo,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				// 开发环境允许 localhost
				if origin == "" || strings.HasPrefix(origin, "http://localhost") {
					return true
				}
				// 生产环境检查白名单
				for _, allowed := range allowedOrigins {
					if origin == allowed {
						return true
					}
				}
				log.Printf("[WS] 拒绝来自 %s 的连接", origin)
				return false
			},
		},
	}
}

// HandleWS 处理 WebSocket 升级请求
// GET /ws?pageId=xxx
// 需要在 URL 查询参数或 Sec-WebSocket-Protocol 中携带 JWT Token
func (h *WSHandler) HandleWS(c *gin.Context) {
	pageID := c.Query("pageId")
	if pageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pageId 不能为空"})
		return
	}

	// 获取 JWT Token（WebSocket 不支持自定义 Header，从 URL 参数获取）
	token := c.Query("token")
	if token == "" {
		token = c.GetHeader("Sec-WebSocket-Protocol")
	}

	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "缺少认证 token"})
		return
	}

	// 验证 Clerk JWT
	claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
		Token:  token,
		Leeway: time.Minute, // 允许1分钟时钟偏差
	})
	if err != nil {
		log.Printf("[WS] Token 验证失败: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 无效", "details": err.Error()})
		return
	}

	// 获取或创建房间
	room, err := h.hub.GetOrCreateRoom(pageID)
	if err != nil {
		if errors.Is(err, domainErrors.ErrPageNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "页面不存在"})
			return
		}
		if errors.Is(err, domainErrors.ErrRoomClosing) {
			c.Header("Retry-After", "0.1")
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":      "房间正在关闭，请稍后重试",
				"retryAfter": 100,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 升级为 WebSocket 连接
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WS] 升级 WebSocket 失败: %v", err)
		return
	}

	// 创建客户端并注册到房间
	// 从数据库获取用户信息（用户名和头像）
	userName := claims.Subject // 默认使用用户 ID
	avatarURL := ""
	if user, err := h.userRepo.GetByID(claims.Subject); err == nil && user != nil {
		if user.Name != "" {
			userName = user.Name
		}
		avatarURL = user.AvatarURL
	}

	userInfo := ws.UserInfo{
		UserID:    claims.Subject,
		UserName:  userName,
		AvatarURL: avatarURL,
		Color:     generateUserColor(claims.Subject),
	}

	client := ws.NewClient(h.hub, conn, pageID, userInfo)

	if err := room.Register(client); err != nil {
		log.Printf("[WS] 注册客户端失败: %v", err)
		conn.Close()
		return
	}

	log.Printf("[WS] 用户 [%s] 连接到页面 [%s]", userInfo.UserID, pageID)

	// 启动读写协程
	go client.WritePump()
	go client.ReadPump()
}

// generateUserColor 根据用户 ID 生成协作光标颜色
func generateUserColor(userID string) string {
	colors := []string{
		"#FF6B6B", // 红色
		"#4ECDC4", // 青色
		"#45B7D1", // 蓝色
		"#96CEB4", // 绿色
		"#FFEAA7", // 黄色
		"#DDA0DD", // 梅红
		"#98D8C8", // 薄荷
		"#F7DC6F", // 金色
	}

	hash := 0
	for _, c := range userID {
		hash = hash*31 + int(c)
	}
	if hash < 0 {
		hash = -hash
	}

	return colors[hash%len(colors)]
}
