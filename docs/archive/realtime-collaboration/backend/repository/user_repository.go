package repository

import (
	"errors"

	"lowercode-go-server/domain/entity"
	domainRepo "lowercode-go-server/domain/repository"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// userRepository GORM 实现 UserRepository 接口
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 构造函数
func NewUserRepository(db *gorm.DB) domainRepo.UserRepository {
	return &userRepository{db: db}
}

// Upsert 创建或更新用户（Clerk Webhook 同步使用）
// 使用 PostgreSQL ON CONFLICT 语法实现 upsert
func (r *userRepository) Upsert(user *entity.User) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}}, // 冲突字段
		DoUpdates: clause.AssignmentColumns([]string{"email", "name", "avatar_url", "updated_at"}),
	}).Create(user).Error
}

// GetByID 根据 Clerk user_id 查询用户
func (r *userRepository) GetByID(userID string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("id = ?", userID).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}
