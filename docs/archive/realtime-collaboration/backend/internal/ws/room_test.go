package ws

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ========== Room 单元测试 ==========
// 测试重点：ApplyPatch 方法和刷盘逻辑

// 创建测试用的 Room（不启动事件循环）
func newTestRoom(id string, initialState []byte, mockService *MockPageService) *Room {
	return &Room{
		ID:           id,
		CurrentState: initialState,
		Version:      1,
		clients:      make(map[*Client]bool),
		broadcast:    make(chan *RoomBroadcast, 256),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		stopChan:     make(chan struct{}),
		flushTicker:  time.NewTicker(FlushInterval),
		pageService:  mockService,
	}
}

func TestRoom_ApplyPatch_Success(t *testing.T) {
	// 测试场景：正常 Patch 应用
	// 版本号 +1，State 更新

	mockService := new(MockPageService)

	// 初始状态
	initialState := []byte(`{"rootId": 1, "components": {"1": {"id": 1, "name": "Page"}}}`)
	room := newTestRoom("test-room", initialState, mockService)

	// JSON Patch: 修改组件名称
	// RFC 6902 格式: [{"op": "replace", "path": "/components/1/name", "value": "NewPage"}]
	patchBytes := []byte(`[{"op": "replace", "path": "/components/1/name", "value": "NewPage"}]`)

	// 应用 Patch（版本号必须匹配）
	err := room.ApplyPatch(patchBytes, 1) // expectedVersion = 1

	assert.NoError(t, err)
	assert.Equal(t, int64(2), room.Version) // 版本号递增

	// 验证状态已更新
	snapshot, version := room.GetSnapshot()
	assert.Equal(t, int64(2), version)
	assert.Contains(t, string(snapshot), `"name":"NewPage"`)
}

func TestRoom_ApplyPatch_VersionConflict(t *testing.T) {
	// 测试场景：版本冲突（乐观锁检查）
	// 传入错误的 expectedVersion，断言返回 VersionConflictError

	mockService := new(MockPageService)

	initialState := []byte(`{"rootId": 1, "components": {}}`)
	room := newTestRoom("test-room", initialState, mockService)
	room.Version = 5 // 当前版本是 5

	patchBytes := []byte(`[{"op": "add", "path": "/test", "value": "hello"}]`)

	// 传入错误的版本号 3（期望 5）
	err := room.ApplyPatch(patchBytes, 3)

	// 验证返回 VersionConflictError
	assert.Error(t, err)

	var versionErr *VersionConflictError
	assert.ErrorAs(t, err, &versionErr)
	assert.Equal(t, int64(5), versionErr.CurrentVersion)
	assert.Equal(t, int64(3), versionErr.ExpectedVersion)

	// 版本号不应该改变
	assert.Equal(t, int64(5), room.Version)
}

func TestRoom_ApplyPatch_InvalidPatch(t *testing.T) {
	// 测试场景：非法 Patch 格式
	// 断言返回 PatchError

	testCases := []struct {
		name       string
		patchBytes []byte
		desc       string
	}{
		{
			name:       "Invalid JSON",
			patchBytes: []byte(`not valid json`),
			desc:       "非法 JSON 格式",
		},
		{
			name:       "Invalid Patch Format",
			patchBytes: []byte(`{"op": "replace"}`), // 不是数组
			desc:       "Patch 必须是数组",
		},
		{
			name:       "Missing Operation",
			patchBytes: []byte(`[{"path": "/test", "value": "hello"}]`), // 缺少 op
			desc:       "缺少 op 字段",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			mockService := new(MockPageService)
			initialState := []byte(`{"rootId": 1}`)
			room := newTestRoom("test-room", initialState, mockService)

			err := room.ApplyPatch(tc.patchBytes, 1)

			// 验证返回 PatchError
			assert.Error(t, err)
			var patchErr *PatchError
			assert.ErrorAs(t, err, &patchErr, tc.desc)
		})
	}
}

func TestRoom_ApplyPatch_InvalidPath(t *testing.T) {
	// 测试场景：Patch 路径不存在
	// 应用一个指向不存在路径的 replace 操作

	mockService := new(MockPageService)
	initialState := []byte(`{"rootId": 1}`)
	room := newTestRoom("test-room", initialState, mockService)

	// 尝试 replace 一个不存在的路径
	patchBytes := []byte(`[{"op": "replace", "path": "/nonexistent/path", "value": "test"}]`)

	err := room.ApplyPatch(patchBytes, 1)

	// 验证返回 PatchError
	assert.Error(t, err)
	var patchErr *PatchError
	assert.ErrorAs(t, err, &patchErr)
}

func TestRoom_ApplyPatch_ThresholdFlush(t *testing.T) {
	// 测试场景：阈值刷盘
	// 连续调用 ApplyPatch 达到 FlushThreshold 次，验证 SavePageState 被异步触发

	mockService := new(MockPageService)
	mockService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)

	initialState := []byte(`{"counter": 0}`)
	room := newTestRoom("test-room", initialState, mockService)
	room.lastPersistedVersion = 1

	// 连续应用 FlushThreshold 次 Patch
	for i := 0; i < FlushThreshold; i++ {
		// 每次都使用 add 操作增加一个字段
		patchBytes := []byte(`[{"op": "add", "path": "/test` + string(rune('a'+i)) + `", "value": ` + string(rune('0'+i%10)) + `}]`)

		err := room.ApplyPatch(patchBytes, room.Version)
		if err != nil {
			// 某些 patch 可能因为格式问题失败，这里用简单的 patch
			t.Logf("Patch %d failed: %v", i, err)
		}
	}

	// 等待异步刷盘完成
	time.Sleep(100 * time.Millisecond)

	// 验证 SavePageState 被调用
	mockService.AssertCalled(t, "SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestRoom_ApplyPatch_Concurrent(t *testing.T) {
	// 测试场景：并发安全
	// 多个 Goroutine 同时调用 ApplyPatch，验证最终 Version 正确递增

	mockService := new(MockPageService)
	mockService.On("SavePageState", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()

	// 使用一个简单的 JSON 对象
	initialState := []byte(`{"value": 0}`)
	room := newTestRoom("test-room", initialState, mockService)

	const goroutines = 10
	successCount := 0
	var mu sync.Mutex
	var wg sync.WaitGroup

	// 多个 Goroutine 同时尝试应用 Patch
	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			// 每个 Goroutine 尝试多次，直到成功
			for attempt := 0; attempt < 10; attempt++ {
				// 使用 GetSnapshot() 安全地读取版本号
				_, currentVersion := room.GetSnapshot()
				patchBytes := []byte(`[{"op": "replace", "path": "/value", "value": 1}]`)

				err := room.ApplyPatch(patchBytes, currentVersion)
				if err == nil {
					mu.Lock()
					successCount++
					mu.Unlock()
					return
				}

				// 版本冲突，重试
				var versionErr *VersionConflictError
				if !assert.ErrorAs(t, err, &versionErr) {
					t.Errorf("Unexpected error type: %v", err)
					return
				}
			}
		}()
	}

	wg.Wait()

	// 验证至少有一些成功的操作
	assert.Greater(t, successCount, 0, "At least some operations should succeed")

	// 使用 GetSnapshot() 安全地读取最终版本号
	_, finalVersion := room.GetSnapshot()
	expectedVersion := int64(1 + successCount)
	assert.Equal(t, expectedVersion, finalVersion, "Version should equal 1 + successful operations")
}

func TestRoom_GetSnapshot(t *testing.T) {
	// 测试场景：GetSnapshot 返回副本
	// 确保返回的是副本而非原始切片

	mockService := new(MockPageService)
	initialState := []byte(`{"test": "value"}`)
	room := newTestRoom("test-room", initialState, mockService)
	room.Version = 5

	// 获取快照
	snapshot, version := room.GetSnapshot()

	assert.Equal(t, int64(5), version)
	assert.Equal(t, `{"test": "value"}`, string(snapshot))

	// 修改返回的快照不应影响原始状态
	snapshot[0] = 'X'
	assert.Equal(t, `{"test": "value"}`, string(room.CurrentState))
}

func TestRoom_ClientCount(t *testing.T) {
	// 测试场景：ClientCount 和 IsStopping 方法

	mockService := new(MockPageService)
	initialState := []byte(`{}`)
	room := newTestRoom("test-room", initialState, mockService)

	// 初始状态
	assert.Equal(t, 0, room.ClientCount())
	assert.False(t, room.IsStopping())

	// 更新计数
	room.updateClientCount(3)
	assert.Equal(t, 3, room.ClientCount())

	// 停止房间
	room.countMu.Lock()
	room.stopping = true
	room.countMu.Unlock()
	assert.True(t, room.IsStopping())
}
