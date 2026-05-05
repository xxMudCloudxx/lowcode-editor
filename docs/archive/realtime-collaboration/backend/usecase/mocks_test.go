package usecase

import (
	"lowercode-go-server/domain/entity"

	"github.com/stretchr/testify/mock"
)

// ========== MockPageRepository ==========
// 实现 repository.PageRepository 接口，用于 PageUseCase 的单元测试

type MockPageRepository struct {
	mock.Mock
}

func (m *MockPageRepository) GetByPageID(pageID string) (*entity.Page, error) {
	args := m.Called(pageID)
	// 处理 nil 情况
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Page), args.Error(1)
}

func (m *MockPageRepository) Create(page *entity.Page) error {
	args := m.Called(page)
	return args.Error(0)
}

func (m *MockPageRepository) UpdateSchema(pageID string, schema []byte, oldVersion, newVersion int64) error {
	args := m.Called(pageID, schema, oldVersion, newVersion)
	return args.Error(0)
}

func (m *MockPageRepository) Delete(pageID string) error {
	args := m.Called(pageID)
	return args.Error(0)
}

// ========== MockPageService (用于 Hub) ==========
// 因为 PageUseCase 需要真实的 Hub，而 Hub 需要 PageService

type MockPageService struct {
	mock.Mock
}

func (m *MockPageService) GetPageState(pageID string) ([]byte, int64, error) {
	args := m.Called(pageID)
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
