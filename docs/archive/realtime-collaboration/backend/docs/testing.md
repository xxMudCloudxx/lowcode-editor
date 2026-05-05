# 单元测试指南

本文档描述项目的单元测试策略、运行方式和覆盖范围。

## 快速开始

```bash
# 运行所有测试（带 race 检测）
go test -race ./...

# 运行指定包的测试
go test -race ./usecase/... ./internal/ws/...

# 查看测试覆盖率
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 测试文件结构

```
├── usecase/
│   ├── mocks_test.go          # MockPageRepository, MockPageService
│   └── page_usecase_test.go   # PageUseCase 单元测试
├── internal/ws/
│   ├── mocks_test.go          # MockPageService
│   ├── hub_test.go            # Hub 单元测试
│   └── room_test.go           # Room 单元测试
```

## 测试覆盖范围

### PageUseCase (`usecase/page_usecase_test.go`)

| 测试场景                                    | 描述                                     |
| ------------------------------------------- | ---------------------------------------- |
| `TestPageUseCase_GetPage_HotPath`           | 房间在内存中，从 Hub 获取数据，不调用 DB |
| `TestPageUseCase_GetPage_ColdPath`          | Hub 无房间，从数据库获取                 |
| `TestPageUseCase_GetPage_ColdPath_NotFound` | 页面不存在，返回 `ErrPageNotFound`       |
| `TestPageUseCase_CreatePage`                | 创建新页面，生成默认 Schema，Version=1   |
| `TestPageUseCase_GetPage_TableDriven`       | 表格驱动测试，覆盖多种场景               |

### Hub (`internal/ws/hub_test.go`)

| 测试场景                                   | 描述                                  |
| ------------------------------------------ | ------------------------------------- |
| `TestHub_GetOrCreateRoom_CacheHit`         | 第一次调用加载数据，第二次返回缓存    |
| `TestHub_GetOrCreateRoom_PageNotFound`     | 页面不存在时返回错误，不创建房间      |
| `TestHub_GetOrCreateRoom_ConcurrentAccess` | 10 Goroutine 并发请求，验证双重检查锁 |
| `TestHub_GetRoom_ReadOnly`                 | GetRoom 是只读操作，不触发创建        |
| `TestHub_GetRoom_ExistingRoom`             | 获取已存在的房间                      |

### Room (`internal/ws/room_test.go`)

| 测试场景                              | 描述                                  |
| ------------------------------------- | ------------------------------------- |
| `TestRoom_ApplyPatch_Success`         | 正常 Patch 应用，版本号 +1            |
| `TestRoom_ApplyPatch_VersionConflict` | 版本冲突，返回 `VersionConflictError` |
| `TestRoom_ApplyPatch_InvalidPatch`    | 非法 Patch 格式，返回 `PatchError`    |
| `TestRoom_ApplyPatch_InvalidPath`     | Patch 路径不存在                      |
| `TestRoom_ApplyPatch_ThresholdFlush`  | 达到 50 次操作后触发异步刷盘          |
| `TestRoom_ApplyPatch_Concurrent`      | 并发安全测试，无 Race Condition       |
| `TestRoom_GetSnapshot`                | 返回副本，不影响原始状态              |
| `TestRoom_ClientCount`                | ClientCount 和 IsStopping 方法        |

## Mock 策略

### 1. 接口 Mock

使用 `github.com/stretchr/testify/mock` 生成 Mock 对象：

```go
type MockPageRepository struct {
    mock.Mock
}

func (m *MockPageRepository) GetByPageID(pageID string) (*entity.Page, error) {
    args := m.Called(pageID)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*entity.Page), args.Error(1)
}
```

### 2. 集成式单元测试

对于依赖具体结构体 `*ws.Hub` 的 `PageUseCase`，采用"集成式单元测试"策略：

```go
// 创建真实的 Hub（注入 Mock PageService）
mockPageService := new(MockPageService)
hub := ws.NewHub(mockPageService)

// PageUseCase 使用真实的 Hub
uc := NewPageUseCase(mockRepo, hub)
```

## 并发测试

### Race Detection

所有测试应使用 `-race` 标志运行：

```bash
go test -race ./...
```

### 并发安全测试示例

```go
func TestHub_GetOrCreateRoom_ConcurrentAccess(t *testing.T) {
    const goroutines = 10
    var wg sync.WaitGroup

    for i := 0; i < goroutines; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            hub.GetOrCreateRoom("concurrent-room")
        }()
    }
    wg.Wait()

    // 核心断言：GetPageState 只被调用了一次
    mockService.AssertNumberOfCalls(t, "GetPageState", 1)
}
```

### 注意事项

1. **避免直接访问共享变量**：使用加锁方法（如 `GetSnapshot()`）读取
2. **使用 sync.WaitGroup**：等待所有 Goroutine 完成
3. **验证调用次数**：使用 `AssertNumberOfCalls()` 验证锁的有效性

## 当前覆盖率

| Package       | Coverage |
| ------------- | -------- |
| `usecase`     | 92.3%    |
| `internal/ws` | 37.1%    |

> **注意**：`internal/ws` 覆盖率较低是因为 `Client` 和 `Room.run()` 事件循环需要 WebSocket 连接，这些组件更适合集成测试。

## 添加新测试

1. 在对应包的 `*_test.go` 文件中添加测试函数
2. 使用表格驱动测试覆盖多种场景
3. 对于并发场景，确保使用 `-race` 标志验证
4. 更新本文档的测试覆盖范围表格
