package ws

import (
	"github.com/stretchr/testify/mock"
)

// ========== MockPageService ==========
// 实现 PageService 接口，用于 Hub 和 Room 的单元测试

type MockPageService struct {
	mock.Mock
}

func (m *MockPageService) GetPageState(pageID string) ([]byte, int64, error) {
	args := m.Called(pageID)
	// 处理 nil 情况
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]byte), args.Get(1).(int64), args.Error(2)
}

func (m *MockPageService) PageExists(pageID string) (bool, error) {
	args := m.Called(pageID)
	return args.Bool(0), args.Error(1)
}

func (m *MockPageService) SavePageState(pageID string, state []byte, oldVersion, newVersion int64) error {
	args := m.Called(pageID, state, oldVersion, newVersion)
	return args.Error(0)
}
