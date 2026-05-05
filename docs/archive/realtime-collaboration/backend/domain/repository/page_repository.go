package repository

import "lowercode-go-server/domain/entity"

// PageRepository 页面数据仓库接口
type PageRepository interface {
	// GetByPageID 根据业务 ID 获取页面
	GetByPageID(pageID string) (*entity.Page, error)

	// Create 创建新页面
	// 注意：禁止使用 GORM Save，它会覆盖 schema 和 version
	Create(page *entity.Page) error

	// UpdateSchema 更新 Schema（协同编辑的热路径）
	// oldVersion: 上次持久化的版本号，用于乐观锁检查
	// newVersion: 要写入的新版本号（允许跳跃）
	// 如果版本不匹配，返回 ErrOptimisticLock
	UpdateSchema(pageID string, schema []byte, oldVersion, newVersion int64) error

	// Delete 删除页面
	// 注意：删除前必须先通过 Hub.CloseRoom 关闭内存中的协同房间
	Delete(pageID string) error
}
