package controller

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"lowercode-go-server/domain/entity"
	domainRepo "lowercode-go-server/domain/repository"

	"github.com/gin-gonic/gin"
	svix "github.com/svix/svix-webhooks/go"
)

// WebhookController 处理 Clerk Webhook 回调
type WebhookController struct {
	userRepo      domainRepo.UserRepository
	webhookSecret string
}

// NewWebhookController 创建 WebhookController 实例
func NewWebhookController(userRepo domainRepo.UserRepository, webhookSecret string) *WebhookController {
	return &WebhookController{
		userRepo:      userRepo,
		webhookSecret: webhookSecret,
	}
}

// ClerkWebhookPayload Clerk Webhook 事件结构
type ClerkWebhookPayload struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

// ClerkUserData Clerk 用户数据结构
type ClerkUserData struct {
	ID             string `json:"id"`
	EmailAddresses []struct {
		EmailAddress string `json:"email_address"`
	} `json:"email_addresses"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	ImageURL  string `json:"image_url"`
}

// HandleClerkWebhook 处理 Clerk Webhook 回调
// POST /webhook/clerk
// 处理 user.created, user.updated, user.deleted 事件
func (wc *WebhookController) HandleClerkWebhook(c *gin.Context) {
	// 读取请求体
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("[Webhook] 读取请求体失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法读取请求体"})
		return
	}

	// 验证 Webhook 签名
	if wc.webhookSecret != "" {
		wh, err := svix.NewWebhook(wc.webhookSecret)
		if err != nil {
			log.Printf("[Webhook] 初始化 Webhook 验证器失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Webhook 配置错误"})
			return
		}

		headers := http.Header{}
		headers.Set("svix-id", c.GetHeader("svix-id"))
		headers.Set("svix-timestamp", c.GetHeader("svix-timestamp"))
		headers.Set("svix-signature", c.GetHeader("svix-signature"))

		if err := wh.Verify(body, headers); err != nil {
			log.Printf("[Webhook] 签名验证失败: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "签名验证失败"})
			return
		}
	} else {
		log.Println("[Webhook] 警告: 未配置 CLERK_WEBHOOK_SECRET，跳过签名验证（仅限开发环境）")
	}

	// 解析事件
	var payload ClerkWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("[Webhook] 解析 Webhook 失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 JSON 格式"})
		return
	}

	log.Printf("[Webhook] 收到事件: %s", payload.Type)

	// 根据事件类型处理
	switch payload.Type {
	case "user.created", "user.updated":
		wc.handleUserUpsert(payload.Data)
	case "user.deleted":
		wc.handleUserDeleted(payload.Data)
	default:
		log.Printf("[Webhook] 忽略事件: %s", payload.Type)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// handleUserUpsert 处理用户创建/更新事件
func (wc *WebhookController) handleUserUpsert(data json.RawMessage) {
	var userData ClerkUserData
	if err := json.Unmarshal(data, &userData); err != nil {
		log.Printf("[Webhook] 解析用户数据失败: %v", err)
		return
	}

	// 提取邮箱（取第一个）
	email := ""
	if len(userData.EmailAddresses) > 0 {
		email = userData.EmailAddresses[0].EmailAddress
	}

	// 组合姓名
	name := userData.FirstName
	if userData.LastName != "" {
		if name != "" {
			name += " "
		}
		name += userData.LastName
	}

	user := &entity.User{
		ID:        userData.ID,
		Email:     email,
		Name:      name,
		AvatarURL: userData.ImageURL,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := wc.userRepo.Upsert(user); err != nil {
		log.Printf("[Webhook] 用户 Upsert 失败: %v", err)
		return
	}

	log.Printf("[Webhook] 用户同步成功: %s (%s)", user.ID, user.Email)
}

// handleUserDeleted 处理用户删除事件
func (wc *WebhookController) handleUserDeleted(data json.RawMessage) {
	var userData struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &userData); err != nil {
		log.Printf("[Webhook] 解析删除事件数据失败: %v", err)
		return
	}

	// TODO: 实现用户删除逻辑（可能需要级联删除用户的页面）
	log.Printf("[Webhook] 用户删除事件: %s（暂未实现删除逻辑）", userData.ID)
}
