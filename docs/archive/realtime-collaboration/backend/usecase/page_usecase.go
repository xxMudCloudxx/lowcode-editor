package usecase

import (
	"time"

	"lowercode-go-server/domain/entity"
	domainErrors "lowercode-go-server/domain/errors"
	"lowercode-go-server/domain/repository"
	"lowercode-go-server/internal/ws"

	"gorm.io/datatypes"
)

// PageUseCase 页面业务逻辑层
type PageUseCase struct {
	repo     repository.PageRepository
	userRepo repository.UserRepository
	hub      *ws.Hub
}

// NewPageUseCase 创建 PageUseCase 实例
func NewPageUseCase(repo repository.PageRepository, userRepo repository.UserRepository, hub *ws.Hub) *PageUseCase {
	return &PageUseCase{repo: repo, userRepo: userRepo, hub: hub}
}

// GetPage 获取页面
// 优先从 Hub 内存读取（保证读到最新协同状态），否则读数据库。
// 使用只读的 GetRoom 不会创建房间，避免"观察者效应"。
func (uc *PageUseCase) GetPage(pageID string) (*entity.Page, error) {
	// 优先从 Hub 内存读取
	if room := uc.hub.GetRoom(pageID); room != nil {
		snapshot, version := room.GetSnapshot()
		return &entity.Page{
			PageID:  pageID,
			Schema:  datatypes.JSON(snapshot),
			Version: version,
		}, nil
	}

	// 内存没有，读数据库
	return uc.repo.GetByPageID(pageID)
}

// CreatePage 创建新页面
// schemaBytes 可选，为 nil 时使用默认空白 schema
func (uc *PageUseCase) CreatePage(pageID, creatorID string, schemaBytes []byte) (*entity.Page, error) {
	// 确保用户存在（解决外键约束问题）
	if err := uc.ensureUserExists(creatorID); err != nil {
		return nil, err
	}

	// 如果没有传入 schema，使用默认 schema
	if schemaBytes == nil {
		defaultSchema := entity.NewDefaultSchema()
		var err error
		schemaBytes, err = defaultSchema.ToBytes()
		if err != nil {
			return nil, err
		}
	}

	page := &entity.Page{
		PageID:    pageID,
		Schema:    datatypes.JSON(schemaBytes),
		Version:   1,
		CreatorID: creatorID,
	}

	if err := uc.repo.Create(page); err != nil {
		return nil, err
	}
	return page, nil
}

// ensureUserExists 确保用户存在，不存在则创建
func (uc *PageUseCase) ensureUserExists(userID string) error {
	user, err := uc.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	// 用户已存在
	if user != nil {
		return nil
	}

	// 用户不存在，创建占位记录
	// 后续 Clerk Webhook 会更新用户信息
	newUser := &entity.User{
		ID:        userID,
		Email:     "",
		Name:      "Unknown User",
		AvatarURL: "",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return uc.userRepo.Upsert(newUser)
}

// DeletePage 删除页面
// 执行"先关房间后删数据"的安全删除流程：
//  1. 检查权限：只有创建者才能删除
//  2. 强制关闭内存中的协同房间
//  3. 删除数据库记录
func (uc *PageUseCase) DeletePage(pageID, operatorID string) error {
	// 查出页面，检查权限
	page, err := uc.repo.GetByPageID(pageID)
	if err != nil {
		return err
	}
	if page == nil {
		return domainErrors.ErrPageNotFound
	}

	// 权限检查：只有创建者才能删除
	if page.CreatorID != operatorID {
		return domainErrors.ErrUnauthorized
	}

	// 先关闭内存中的协同房间
	uc.hub.CloseRoom(pageID)

	// 删除数据库记录
	return uc.repo.Delete(pageID)
}
