package entity

import (
	"encoding/json"
	"time"

	"gorm.io/datatypes"
)

// --- Schema 结构定义 ---

// PageSchema 页面 Schema 结构，存储在数据库 JSONB 字段中
type PageSchema struct {
	RootID     int64                `json:"rootId"`
	Components map[string]Component `json:"components"`
}

// Component 组件结构
type Component struct {
	ID       int64           `json:"id"` // 时间戳 ID
	Name     string          `json:"name"`
	Desc     string          `json:"desc"`
	ParentID *int64          `json:"parentId,omitempty"`
	Children []int64         `json:"children,omitempty"`
	Props    json.RawMessage `json:"props,omitempty"`
	Styles   json.RawMessage `json:"styles,omitempty"`
}

// NewDefaultSchema 创建默认的空白 Schema
func NewDefaultSchema() *PageSchema {
	rootID := int64(1)
	return &PageSchema{
		RootID: rootID,
		Components: map[string]Component{
			"1": {
				ID:       rootID,
				Name:     "Page",
				Desc:     "页面根节点",
				ParentID: nil,
				Children: []int64{},
				Props:    json.RawMessage(`{}`),
				Styles:   json.RawMessage(`{}`),
			},
		},
	}
}

// MarshalJSON 实现 JSON 序列化
func (s *PageSchema) MarshalJSON() ([]byte, error) {
	type Alias PageSchema
	return json.Marshal((*Alias)(s))
}

// ToBytes 将 Schema 序列化为 []byte
func (s *PageSchema) ToBytes() ([]byte, error) {
	return json.Marshal(s)
}

// --- Page 数据库模型 ---

// Page 页面数据库模型
type Page struct {
	ID        uint           `gorm:"primaryKey"`
	PageID    string         `gorm:"uniqueIndex;size:64"`
	Schema    datatypes.JSON `gorm:"type:jsonb"`
	Version   int64          `gorm:"default:0"`
	CreatorID string         `gorm:"size:64;index"` // Clerk user_id

	Creator   User `gorm:"foreignKey:CreatorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
