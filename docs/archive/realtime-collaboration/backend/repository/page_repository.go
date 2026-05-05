package repository

import (
	"errors"
	"strings"

	"lowercode-go-server/domain/entity"
	domainErrors "lowercode-go-server/domain/errors"
	domainRepo "lowercode-go-server/domain/repository"

	"gorm.io/gorm"
)

// pageRepository GORM 实现 PageRepository 接口
// 同时实现 ws.PageService 接口供 Hub 使用
type pageRepository struct {
	db *gorm.DB
}

// NewPageRepository 创建 PageRepository 实例
func NewPageRepository(db *gorm.DB) domainRepo.PageRepository {
	return &pageRepository{db: db}
}

// --- domain.PageRepository 接口实现 ---

// GetByPageID 根据业务 ID 查询页面
func (r *pageRepository) GetByPageID(pageID string) (*entity.Page, error) {
	var page entity.Page
	err := r.db.Where("page_id = ?", pageID).First(&page).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &page, err
}

// Create 创建新页面
// 注意：禁止使用 GORM Save，它会覆盖 schema 和 version
func (r *pageRepository) Create(page *entity.Page) error {
	err := r.db.Create(page).Error
	if err != nil {
		// 检查唯一约束冲突（PostgreSQL 错误码 23505 = unique_violation）
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "23505") ||
			strings.Contains(err.Error(), "UNIQUE constraint") {
			return domainErrors.ErrPageAlreadyExists
		}
		return err
	}
	return nil
}

// UpdateSchema 更新 Schema 字段（协同编辑热路径）
// 支持版本跳跃：内存中可能积累了多个版本，一次性刷盘
// oldVersion: 上次持久化的版本号（用于 WHERE 条件）
// newVersion: 要写入的新版本号（允许跳跃）
func (r *pageRepository) UpdateSchema(pageID string, schema []byte, oldVersion, newVersion int64) error {
	result := r.db.Model(&entity.Page{}).
		Where("page_id = ? AND version = ?", pageID, oldVersion).
		Updates(map[string]interface{}{
			"schema":  string(schema),
			"version": newVersion,
		})

	if result.Error != nil {
		return result.Error
	}

	// 检查是否更新了记录，RowsAffected == 0 表示版本冲突或页面不存在
	if result.RowsAffected == 0 {
		return domainErrors.ErrOptimisticLock
	}

	return nil
}

// --- ws.PageService 接口实现 ---

// GetPageState 获取页面状态（供 Hub 使用）
// 页面不存在时返回 ErrPageNotFound，阻止幽灵房间的创建
func (r *pageRepository) GetPageState(pageID string) ([]byte, int64, error) {
	page, err := r.GetByPageID(pageID)
	if err != nil {
		return nil, 0, err
	}
	if page == nil {
		return nil, 0, domainErrors.ErrPageNotFound
	}
	return []byte(page.Schema), page.Version, nil
}

// PageExists 检查页面是否存在
func (r *pageRepository) PageExists(pageID string) (bool, error) {
	page, err := r.GetByPageID(pageID)
	if err != nil {
		return false, err
	}
	return page != nil, nil
}

// SavePageState 保存页面状态（供 Hub 使用）
// oldVersion: 上次持久化的版本（用于乐观锁检查）
// newVersion: 当前内存中的版本（要写入 DB）
func (r *pageRepository) SavePageState(pageID string, state []byte, oldVersion, newVersion int64) error {
	return r.UpdateSchema(pageID, state, oldVersion, newVersion)
}

// Delete 删除页面
// 注意：调用前必须先调用 Hub.CloseRoom 关闭内存中的协同房间
func (r *pageRepository) Delete(pageID string) error {
	return r.db.Where("page_id = ?", pageID).Delete(&entity.Page{}).Error
}
