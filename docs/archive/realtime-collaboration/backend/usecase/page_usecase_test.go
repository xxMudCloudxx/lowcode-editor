package usecase

import (
	"testing"

	"lowercode-go-server/domain/entity"
	domainErrors "lowercode-go-server/domain/errors"
	"lowercode-go-server/internal/ws"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/datatypes"
)

// ========== PageUseCase 单元测试 ==========
// 测试核心业务逻辑、内存/DB 优先级

// TestPageUseCase_GetPage_HotPath 测试热路径
// 房间已存在于 Hub 中，直接从 Hub 获取数据，不调用 repo.GetByPageID
func TestPageUseCase_GetPage_HotPath(t *testing.T) {
	// 1. 创建 Mock
	mockRepo := new(MockPageRepository)
	mockPageService := new(MockPageService)

	// 设置 PageService Mock：返回初始状态
	initialState := []byte(`{"rootId": 1, "components": {"1": {"id": 1, "name": "Page"}}}`)
	mockPageService.On("GetPageState", "hot-page").Return(initialState, int64(5), nil).Once()
	mockPageService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()

	// 2. 创建真实的 Hub（注入 Mock PageService）
	hub := ws.NewHub(mockPageService)

	// 3. 预热：在 Hub 中创建房间（模拟协同编辑中的状态）
	room, err := hub.GetOrCreateRoom("hot-page")
	assert.NoError(t, err)
	assert.NotNil(t, room)

	// 4. 创建 PageUseCase
	uc := NewPageUseCase(mockRepo, hub)

	// 5. 调用 GetPage（应该走热路径）
	page, err := uc.GetPage("hot-page")

	// 6. 断言
	assert.NoError(t, err)
	assert.NotNil(t, page)
	assert.Equal(t, "hot-page", page.PageID)
	assert.Equal(t, int64(5), page.Version)

	// 核心断言：repo.GetByPageID 从未被调用！
	mockRepo.AssertNotCalled(t, "GetByPageID", mock.Anything)
}

// TestPageUseCase_GetPage_ColdPath 测试冷路径
// Hub 中无此房间，从数据库获取
func TestPageUseCase_GetPage_ColdPath(t *testing.T) {
	// 1. 创建 Mock
	mockRepo := new(MockPageRepository)
	mockPageService := new(MockPageService)

	// 2. 创建真实的 Hub（不预热，保持空状态）
	hub := ws.NewHub(mockPageService)

	// 3. 设置 repo Mock：返回数据库中的页面
	dbPage := &entity.Page{
		PageID:  "cold-page",
		Schema:  datatypes.JSON(`{"rootId": 1, "components": {}}`),
		Version: 3,
	}
	mockRepo.On("GetByPageID", "cold-page").Return(dbPage, nil).Once()

	// 4. 创建 PageUseCase
	uc := NewPageUseCase(mockRepo, hub)

	// 5. 调用 GetPage（应该走冷路径）
	page, err := uc.GetPage("cold-page")

	// 6. 断言
	assert.NoError(t, err)
	assert.NotNil(t, page)
	assert.Equal(t, "cold-page", page.PageID)
	assert.Equal(t, int64(3), page.Version)

	// 核心断言：repo.GetByPageID 被调用了一次
	mockRepo.AssertCalled(t, "GetByPageID", "cold-page")
	mockRepo.AssertNumberOfCalls(t, "GetByPageID", 1)
}

// TestPageUseCase_GetPage_ColdPath_NotFound 测试冷路径 - 页面不存在
func TestPageUseCase_GetPage_ColdPath_NotFound(t *testing.T) {
	mockRepo := new(MockPageRepository)
	mockPageService := new(MockPageService)
	hub := ws.NewHub(mockPageService)

	// 设置 repo Mock：返回页面不存在错误
	mockRepo.On("GetByPageID", "nonexistent").Return(nil, domainErrors.ErrPageNotFound)

	uc := NewPageUseCase(mockRepo, hub)

	page, err := uc.GetPage("nonexistent")

	assert.Nil(t, page)
	assert.ErrorIs(t, err, domainErrors.ErrPageNotFound)
}

// TestPageUseCase_CreatePage 测试创建新页面
// 验证生成了默认 Schema 并调用了 repo.Create
func TestPageUseCase_CreatePage(t *testing.T) {
	mockRepo := new(MockPageRepository)
	mockPageService := new(MockPageService)
	hub := ws.NewHub(mockPageService)

	// 设置 repo Mock：Create 成功
	mockRepo.On("Create", mock.MatchedBy(func(page *entity.Page) bool {
		// 验证 page 的属性
		return page.PageID == "new-page" &&
			page.CreatorID == "user-123" &&
			page.Version == 1 &&
			len(page.Schema) > 0
	})).Return(nil).Once()

	uc := NewPageUseCase(mockRepo, hub)

	// 创建页面
	page, err := uc.CreatePage("new-page", "user-123")

	// 断言
	assert.NoError(t, err)
	assert.NotNil(t, page)
	assert.Equal(t, "new-page", page.PageID)
	assert.Equal(t, "user-123", page.CreatorID)
	assert.Equal(t, int64(1), page.Version)

	// 验证 Schema 包含默认结构
	schemaStr := string(page.Schema)
	assert.Contains(t, schemaStr, `"rootId"`)
	assert.Contains(t, schemaStr, `"components"`)
	assert.Contains(t, schemaStr, `"Page"`) // 根组件名称

	// 验证 repo.Create 被调用
	mockRepo.AssertCalled(t, "Create", mock.Anything)
}

// TestPageUseCase_CreatePage_Error 测试创建失败
func TestPageUseCase_CreatePage_Error(t *testing.T) {
	mockRepo := new(MockPageRepository)
	mockPageService := new(MockPageService)
	hub := ws.NewHub(mockPageService)

	// 设置 repo Mock：Create 失败
	mockRepo.On("Create", mock.Anything).Return(domainErrors.ErrOptimisticLock)

	uc := NewPageUseCase(mockRepo, hub)

	page, err := uc.CreatePage("new-page", "user-123")

	assert.Nil(t, page)
	assert.Error(t, err)
}

// TestPageUseCase_GetPage_TableDriven 表格驱动测试
func TestPageUseCase_GetPage_TableDriven(t *testing.T) {
	testCases := []struct {
		name           string
		pageID         string
		roomExists     bool
		roomVersion    int64
		dbPage         *entity.Page
		dbError        error
		expectedErr    error
		expectedVer    int64
		repoShouldCall bool
	}{
		{
			name:           "Hot Path - Room exists",
			pageID:         "hot-page",
			roomExists:     true,
			roomVersion:    10,
			repoShouldCall: false,
			expectedVer:    10,
		},
		{
			name:       "Cold Path - DB success",
			pageID:     "cold-page",
			roomExists: false,
			dbPage: &entity.Page{
				PageID:  "cold-page",
				Schema:  datatypes.JSON(`{}`),
				Version: 5,
			},
			repoShouldCall: true,
			expectedVer:    5,
		},
		{
			name:           "Cold Path - DB not found",
			pageID:         "missing-page",
			roomExists:     false,
			dbError:        domainErrors.ErrPageNotFound,
			repoShouldCall: true,
			expectedErr:    domainErrors.ErrPageNotFound,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockRepo := new(MockPageRepository)
			mockPageService := new(MockPageService)
			hub := ws.NewHub(mockPageService)

			// 设置 PageService Mock（用于预热 Hub）
			if tc.roomExists {
				initialState := []byte(`{"rootId": 1}`)
				mockPageService.On("GetPageState", tc.pageID).Return(initialState, tc.roomVersion, nil).Once()
				mockPageService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()

				// 预热 Hub
				_, err := hub.GetOrCreateRoom(tc.pageID)
				assert.NoError(t, err)
			}

			// 设置 repo Mock
			if tc.repoShouldCall {
				mockRepo.On("GetByPageID", tc.pageID).Return(tc.dbPage, tc.dbError)
			}

			uc := NewPageUseCase(mockRepo, hub)
			page, err := uc.GetPage(tc.pageID)

			if tc.expectedErr != nil {
				assert.ErrorIs(t, err, tc.expectedErr)
				assert.Nil(t, page)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, page)
				assert.Equal(t, tc.expectedVer, page.Version)
			}

			// 验证 repo 调用
			if tc.repoShouldCall {
				mockRepo.AssertCalled(t, "GetByPageID", tc.pageID)
			} else {
				mockRepo.AssertNotCalled(t, "GetByPageID", mock.Anything)
			}
		})
	}
}
