package ws

import (
	"sync"
	"testing"

	domainErrors "lowercode-go-server/domain/errors"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ========== Hub 单元测试 ==========
// 测试重点：GetOrCreateRoom 的并发安全性和缓存逻辑

func TestHub_GetOrCreateRoom_CacheHit(t *testing.T) {
	// 测试场景：缓存命中
	// 第一次调用应该调用 PageService.GetPageState
	// 第二次调用同一 ID 应该直接返回内存中的 Room，不再调用 DB

	mockService := new(MockPageService)
	hub := NewHub(mockService)

	initialState := []byte(`{"rootId": 1, "components": {}}`)

	// 设置 Mock：第一次调用返回数据
	mockService.On("GetPageState", "room-1").Return(initialState, int64(1), nil).Once()
	// SavePageState 可能在 Room 销毁时被调用
	mockService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()

	// 第一次调用：应该从 DB 加载
	room1, err := hub.GetOrCreateRoom("room-1")
	assert.NoError(t, err)
	assert.NotNil(t, room1)
	assert.Equal(t, "room-1", room1.ID)

	// 第二次调用：应该返回缓存的 Room
	room2, err := hub.GetOrCreateRoom("room-1")
	assert.NoError(t, err)
	assert.NotNil(t, room2)

	// 验证是同一个 Room 实例
	assert.Same(t, room1, room2)

	// 验证 GetPageState 只被调用了一次
	mockService.AssertNumberOfCalls(t, "GetPageState", 1)
}

func TestHub_GetOrCreateRoom_PageNotFound(t *testing.T) {
	// 测试场景：页面不存在
	// 当 PageService 返回 ErrPageNotFound 时，Hub 不应创建房间

	mockService := new(MockPageService)
	hub := NewHub(mockService)

	// 设置 Mock：返回 ErrPageNotFound
	mockService.On("GetPageState", "non-existent").Return(nil, int64(0), domainErrors.ErrPageNotFound)

	// 调用应该返回错误
	room, err := hub.GetOrCreateRoom("non-existent")

	assert.Nil(t, room)
	assert.ErrorIs(t, err, domainErrors.ErrPageNotFound)
	mockService.AssertExpectations(t)
}

func TestHub_GetOrCreateRoom_ConcurrentAccess(t *testing.T) {
	// 测试场景：并发安全
	// 10 个 Goroutine 同时请求同一个 Room ID
	// PageService.GetPageState 应该只被调用一次（验证 sync.Mutex 双重检查锁）

	mockService := new(MockPageService)
	hub := NewHub(mockService)

	initialState := []byte(`{"rootId": 1, "components": {}}`)

	// 设置 Mock：只允许调用一次
	mockService.On("GetPageState", "concurrent-room").Return(initialState, int64(1), nil).Once()
	mockService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()

	const goroutines = 10
	var wg sync.WaitGroup
	rooms := make([]*Room, goroutines)
	errors := make([]error, goroutines)

	// 启动多个 Goroutine 同时请求
	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			rooms[idx], errors[idx] = hub.GetOrCreateRoom("concurrent-room")
		}(i)
	}

	wg.Wait()

	// 验证所有调用都成功
	for i := 0; i < goroutines; i++ {
		assert.NoError(t, errors[i], "Goroutine %d should succeed", i)
		assert.NotNil(t, rooms[i], "Goroutine %d should get a room", i)
	}

	// 验证所有 Goroutine 返回的是同一个 Room 实例
	for i := 1; i < goroutines; i++ {
		assert.Same(t, rooms[0], rooms[i], "All goroutines should get the same Room instance")
	}

	// 核心断言：GetPageState 只被调用了一次！
	mockService.AssertNumberOfCalls(t, "GetPageState", 1)
}

func TestHub_GetRoom_ReadOnly(t *testing.T) {
	// 测试场景：GetRoom 是只读操作
	// 当房间不在内存中时，应返回 nil，不触发创建

	mockService := new(MockPageService)
	hub := NewHub(mockService)

	// 房间不存在时，GetRoom 应该返回 nil
	room := hub.GetRoom("non-existent")
	assert.Nil(t, room)

	// 验证 PageService 从未被调用
	mockService.AssertNotCalled(t, "GetPageState", mock.Anything)
}

func TestHub_GetRoom_ExistingRoom(t *testing.T) {
	// 测试场景：GetRoom 获取已存在的房间

	mockService := new(MockPageService)
	hub := NewHub(mockService)

	initialState := []byte(`{"rootId": 1, "components": {}}`)

	// 先通过 GetOrCreateRoom 创建房间
	mockService.On("GetPageState", "existing-room").Return(initialState, int64(1), nil).Once()
	mockService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()

	createdRoom, err := hub.GetOrCreateRoom("existing-room")
	assert.NoError(t, err)

	// 使用 GetRoom 获取
	gotRoom := hub.GetRoom("existing-room")
	assert.NotNil(t, gotRoom)
	assert.Same(t, createdRoom, gotRoom)
}
