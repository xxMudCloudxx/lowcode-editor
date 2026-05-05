// Package ws 实现基于 WebSocket 的实时协同编辑功能。
// 提供 Hub、Room、Client 三层抽象，采用 Actor Model 模式管理并发编辑会话。
package ws

import (
	"errors"
	"log"
	"sync"

	domainErrors "lowercode-go-server/domain/errors"
)

// Hub 负责管理所有协同编辑房间的生命周期。
// 作为中央协调者，Hub 只处理房间的创建和销毁，不参与业务消息处理。
type Hub struct {
	rooms       map[string]*Room
	mu          sync.RWMutex
	idleRoom    chan *Room // 空闲房间信号通道，用于接收销毁请求
	pageService PageService
}

// PageService 定义数据库操作接口。
// 通过接口抽象，Hub 可以与持久层解耦。
type PageService interface {
	// GetPageState 获取页面状态和版本号。
	// 如果页面不存在，返回 (nil, 0, ErrPageNotFound)。
	GetPageState(pageID string) ([]byte, int64, error)

	// PageExists 检查页面是否存在于数据库中。
	PageExists(pageID string) (bool, error)

	// SavePageState 持久化页面状态，支持乐观锁。
	// oldVersion 用于冲突检测，newVersion 为目标版本。
	SavePageState(pageID string, state []byte, oldVersion, newVersion int64) error
}

// NewHub 创建并返回 Hub 实例。
func NewHub(pageService PageService) *Hub {
	return &Hub{
		rooms:       make(map[string]*Room),
		idleRoom:    make(chan *Room, 16),
		pageService: pageService,
	}
}

// Run 启动 Hub 事件循环。
// 该方法应在独立 goroutine 中调用，会阻塞直到 Hub 停止。
func (h *Hub) Run() {
	log.Println("[Hub] 已启动")

	for room := range h.idleRoom {
		// 在独立 goroutine 中处理空闲房间，避免阻塞事件循环
		go h.handleIdleRoom(room)
	}
}

// handleIdleRoom 处理空闲房间的销毁请求。
// 执行双重检查后决定是否销毁，并确保数据刷盘后再移除。
func (h *Hub) handleIdleRoom(room *Room) {
	// 双重检查：处理期间可能有新客户端加入
	if room.ClientCount() > 0 {
		log.Printf("[Hub] 房间 %s 已有新用户，取消销毁", room.ID)
		return
	}

	// 先停止房间并刷盘（阻塞调用）
	room.Stop()

	// 安全删除：检查指针同一性，防止误删新创建的同名房间
	h.mu.Lock()
	defer h.mu.Unlock()

	if currentRoom, ok := h.rooms[room.ID]; ok && currentRoom == room {
		delete(h.rooms, room.ID)
		log.Printf("[Hub] 房间 %s 已销毁", room.ID)
	} else {
		log.Printf("[Hub] 房间 %s 已被替换或移除，跳过删除", room.ID)
	}
}

// GetRoom 只读获取房间，不会创建新房间。
// 适用于 HTTP GET 等只读请求场景。
//
// 即使房间正在停止，其数据仍然有效（受 stateMu 保护），故仍返回。
func (h *Hub) GetRoom(roomID string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room, exists := h.rooms[roomID]
	if exists {
		return room
	}
	return nil
}

// GetOrCreateRoom 获取或创建房间。
// 只有数据库中存在的页面才会创建对应房间（Pre-creation 模式）。
//
// 返回值：
//   - 成功时返回 Room 指针
//   - 页面不存在时返回 ErrPageNotFound
//   - 房间正在关闭时返回 ErrRoomClosing
func (h *Hub) GetOrCreateRoom(roomID string) (*Room, error) {
	// 快速路径：读锁
	h.mu.RLock()
	room, exists := h.rooms[roomID]
	h.mu.RUnlock()

	if exists {
		if room.IsStopping() {
			log.Printf("[Hub] 房间 %s 正在关闭，请客户端重试", roomID)
			return nil, domainErrors.ErrRoomClosing
		}
		return room, nil
	}

	// 慢速路径：写锁创建
	h.mu.Lock()
	defer h.mu.Unlock()

	// 获取写锁后再次检查
	room, exists = h.rooms[roomID]
	if exists {
		if room.IsStopping() {
			log.Printf("[Hub] 房间 %s 正在关闭，请客户端重试", roomID)
			return nil, domainErrors.ErrRoomClosing
		}
		return room, nil
	}

	// 从数据库加载状态
	state, version, err := h.pageService.GetPageState(roomID)
	if err != nil {
		if errors.Is(err, domainErrors.ErrPageNotFound) {
			log.Printf("[Hub] 页面 %s 不存在，拒绝创建房间", roomID)
			return nil, domainErrors.ErrPageNotFound
		}
		log.Printf("[Hub] 加载页面 %s 失败: %v", roomID, err)
		return nil, err
	}

	// 创建并注册房间
	room = NewRoom(roomID, state, h.pageService, h)
	room.Version = version
	room.lastPersistedVersion = version
	h.rooms[roomID] = room

	log.Printf("[Hub] 创建房间 %s，版本: %d", roomID, version)
	return room, nil
}

// NotifyIdle 由 Room 调用，通知 Hub 该房间已空闲。
func (h *Hub) NotifyIdle(room *Room) {
	h.idleRoom <- room
}

// CloseRoom 强制关闭房间，用于页面删除场景。
// 执行"先关房间后删数据"的安全删除流程。
func (h *Hub) CloseRoom(roomID string) {
	h.mu.Lock()
	room, exists := h.rooms[roomID]
	if !exists {
		h.mu.Unlock()
		log.Printf("[Hub] 房间 %s 不存在于内存中，无需关闭", roomID)
		return
	}

	// 先从 map 移除，防止新客户端加入
	delete(h.rooms, roomID)
	h.mu.Unlock()

	// 停止房间并刷盘（阻塞调用）
	room.StopWithReason(ErrPageDeleted, "页面已被删除")

	log.Printf("[Hub] 强制关闭房间 %s（页面被删除）", roomID)
}
