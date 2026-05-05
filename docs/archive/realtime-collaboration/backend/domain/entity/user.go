package entity

import "time"

// User Clerk 用户同步表
type User struct {
    ID        string    `gorm:"primaryKey;size:64"` // Clerk user_id
    Email     string    `gorm:"size:255"`
    Name      string    `gorm:"size:100"`
    AvatarURL string    `gorm:"size:500"`
    CreatedAt time.Time
    UpdatedAt time.Time
}