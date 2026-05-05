package repository

import "lowercode-go-server/domain/entity"

type UserRepository interface {
	// Upsert = Update + Insert（存在则更新，不存在则创建）
    Upsert(user *entity.User) error

	// 根据 Clerk user_id 获取用户
    GetByID(userID string) (*entity.User, error)
}