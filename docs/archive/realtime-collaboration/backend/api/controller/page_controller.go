package controller

import (
	"encoding/json"
	"errors"
	"net/http"

	"lowercode-go-server/api/middleware"
	domainErrors "lowercode-go-server/domain/errors"
	"lowercode-go-server/usecase"

	"github.com/gin-gonic/gin"
)

// --- 响应结构定义 ---

// PageResponse 页面响应结构
type PageResponse struct {
	PageID  string      `json:"pageId"`
	Schema  interface{} `json:"schema"`
	Version int64       `json:"version"`
}

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

// MessageResponse 消息响应结构
type MessageResponse struct {
	Message string `json:"message"`
	PageID  string `json:"pageId,omitempty"`
}

// --- 控制器定义 ---

// PageController 页面 HTTP 控制器
type PageController struct {
	pageUseCase *usecase.PageUseCase
}

// NewPageController 创建 PageController 实例
func NewPageController(pageUseCase *usecase.PageUseCase) *PageController {
	return &PageController{pageUseCase: pageUseCase}
}

// GetPage 获取页面
// GET /api/pages/:pageId
// 支持 Hub 内存优先读取，回退到数据库
func (pc *PageController) GetPage(c *gin.Context) {
	pageID := c.Param("pageId")
	if pageID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "pageId 不能为空"})
		return
	}

	page, err := pc.pageUseCase.GetPage(pageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	if page == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "页面不存在"})
		return
	}

	c.JSON(http.StatusOK, PageResponse{
		PageID:  page.PageID,
		Schema:  page.Schema,
		Version: page.Version,
	})
}

// CreatePageRequest 创建页面请求结构
type CreatePageRequest struct {
	PageID string      `json:"pageId" binding:"required"`
	Schema interface{} `json:"schema"` // 可选，传入初始 schema
}

// CreatePage 创建新页面
// POST /api/pages
// 请求体: { "pageId": "xxx", "schema": {...} }
// schema 可选，不传则使用默认空白 schema
func (pc *PageController) CreatePage(c *gin.Context) {
	var req CreatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "pageId 不能为空"})
		return
	}

	userID, exists := c.Get(middleware.ContextKeyUserID)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未获取到用户信息"})
		return
	}

	// 将 schema 转换为 []byte
	var schemaBytes []byte
	if req.Schema != nil {
		var err error
		schemaBytes, err = json.Marshal(req.Schema)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "schema 格式无效"})
			return
		}
	}

	page, err := pc.pageUseCase.CreatePage(req.PageID, userID.(string), schemaBytes)
	if err != nil {
		if errors.Is(err, domainErrors.ErrPageAlreadyExists) {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "页面已存在"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, PageResponse{
		PageID:  page.PageID,
		Schema:  page.Schema,
		Version: page.Version,
	})
}

// DeletePage 删除页面
// DELETE /api/pages/:pageId
// 注意：此操作会强制关闭协同编辑房间，踢出所有在线用户
func (pc *PageController) DeletePage(c *gin.Context) {
	pageID := c.Param("pageId")
	if pageID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "pageId 不能为空"})
		return
	}

	userID, exists := c.Get(middleware.ContextKeyUserID)
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "未获取到用户信息"})
		return
	}

	if err := pc.pageUseCase.DeletePage(pageID, userID.(string)); err != nil {
		switch {
		case errors.Is(err, domainErrors.ErrPageNotFound):
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "页面不存在"})
		case errors.Is(err, domainErrors.ErrUnauthorized):
			c.JSON(http.StatusForbidden, ErrorResponse{Error: "无权限删除此页面"})
		default:
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, MessageResponse{
		Message: "页面已删除",
		PageID:  pageID,
	})
}
