package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	jsonpatch "github.com/evanphx/json-patch/v5"
)

// Room 代表一个协同编辑房间，采用 Actor Model 模式实现。
// 所有对 clients map 的操作都在 run() 事件循环中串行处理，因此无需加锁。
type Room struct {
	ID           string
	CurrentState []byte
	Version      int64
	CanvasSize   *CanvasSize

	// clients map 只在 run() 内访问，无需锁保护
	clients map[*Client]bool

	// clientStates 存储每个客户端的短暂状态（光标位置、选中组件）
	// 在 run() 内串行访问，无需锁保护
	clientStates map[*Client]*ClientState

	// 事件通道
	broadcast   chan *RoomBroadcast     // 广播消息
	register    chan *Client            // 加入请求
	unregister  chan *Client            // 退出请求
	syncRequest chan *Client            // 同步请求
	stateUpdate chan *ClientStateUpdate // 客户端状态更新（光标/选中）
	stopChan    chan struct{}           // 停止信号
	doneChan    chan struct{}           // run() 完全退出信号

	// 状态标志
	stopping    bool         // 是否正在停止
	clientCount int          // 客户端计数，供 Hub 双重检查使用
	countMu     sync.RWMutex // 保护 clientCount 和 stopping

	// 状态锁，仅用于保护 CurrentState 和 Version 的并发读写
	stateMu  sync.RWMutex
	canvasMu sync.RWMutex

	// 刷盘相关
	lastPersistedVersion int64
	flushTicker          *time.Ticker
	pageService          PageService

	// Hub 反向引用
	hub *Hub
}

// RoomBroadcast 广播消息结构
type RoomBroadcast struct {
	Message    []byte
	Sender     *Client
	IsCritical bool
}

// 刷盘配置常量
const (
	FlushInterval  = 30 * time.Second // 定时刷盘间隔
	FlushThreshold = 50               // 版本差异阈值触发刷盘
)

// NewRoom 创建房间并启动事件循环
func NewRoom(id string, initialState []byte, pageService PageService, hub *Hub) *Room {
	r := &Room{
		ID:           id,
		CurrentState: initialState,
		Version:      1,
		clients:      make(map[*Client]bool),
		clientStates: make(map[*Client]*ClientState),
		broadcast:    make(chan *RoomBroadcast, 256),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		syncRequest:  make(chan *Client),
		stateUpdate:  make(chan *ClientStateUpdate, 1024), // 高频光标消息需要大缓冲
		stopChan:     make(chan struct{}),
		doneChan:     make(chan struct{}),
		flushTicker:  time.NewTicker(FlushInterval),
		pageService:  pageService,
		hub:          hub,
		CanvasSize: &CanvasSize{
			Width:  1024,
			Height: "auto",
			Mode:   "tablet",
		},
	}

	go r.run()

	log.Printf("[Room %s] 已创建并启动", id)
	return r
}

// run 是房间的主事件循环，所有操作在此串行处理。
func (r *Room) run() {
	defer func() {
		r.flushTicker.Stop()
		r.flushToDB("销毁前")
		close(r.doneChan)
		log.Printf("[Room %s] 事件循环已停止", r.ID)
	}()

	for {
		select {
		// 处理客户端注册
		case client := <-r.register:
			// 踢掉同一用户的旧连接（防止重复计数）
			for oldClient := range r.clients {
				if oldClient.UserInfo.UserID == client.UserInfo.UserID {
					log.Printf("[Room %s] 踢掉用户 [%s] 的旧连接", r.ID, client.UserInfo.UserName)
					delete(r.clients, oldClient)
					delete(r.clientStates, oldClient)
					close(oldClient.send)
					r.updateClientCount(-1)
					// 不需要广播 user-leave，因为马上就会 user-join
				}
			}

			r.clients[client] = true
			r.clientStates[client] = &ClientState{} // 初始化空状态
			client.Room = r
			r.updateClientCount(1)
			r.sendSyncToClient(client)
			r.broadcastUserJoin(client) // 广播新用户加入
			log.Printf("[Room %s] 用户 [%s] 加入，当前人数: %d",
				r.ID, client.UserInfo.UserName, len(r.clients))

		// 处理客户端注销
		case client := <-r.unregister:
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				delete(r.clientStates, client) // 清理状态
				close(client.send)
				r.updateClientCount(-1)
				r.broadcastUserLeave(client) // 广播用户离开，清理死光标
				log.Printf("[Room %s] 用户 [%s] 离开，剩余人数: %d",
					r.ID, client.UserInfo.UserName, len(r.clients))

				// 房间空闲时通知 Hub
				if len(r.clients) == 0 && r.hub != nil {
					r.hub.NotifyIdle(r)
				}
			}

		// 处理客户端状态更新（增量合并，避免覆盖）
		case update := <-r.stateUpdate:
			state, exists := r.clientStates[update.Client]
			if !exists {
				state = &ClientState{}
				r.clientStates[update.Client] = state
			}
			// 增量合并：只更新非 nil 的字段
			if update.CursorX != nil {
				state.CursorX = *update.CursorX
			}
			if update.CursorY != nil {
				state.CursorY = *update.CursorY
			}
			if update.SelectedComponentID != nil {
				state.SelectedComponentID = *update.SelectedComponentID
			}
			// 注意：实时广播已由 client.go 处理，这里只存储快照供新用户同步

		// 处理同步请求
		case client := <-r.syncRequest:
			// 这个同步请求处理是专门给request-sync消息的
			r.sendSyncToClient(client)
			log.Printf("[Room %s] 已响应用户 [%s] 的同步请求", r.ID, client.UserInfo.UserName)

		// 处理广播消息
		case msg := <-r.broadcast:
			for client := range r.clients {
				if msg.Sender != nil && client == msg.Sender {
					continue
				}

				select {
				case client.send <- msg.Message:
					// 发送成功
				default:
					// 缓冲区满时的处理策略
					if msg.IsCritical {
						log.Printf("[Room %s] 关键消息阻塞，踢出用户 [%s]",
							r.ID, client.UserInfo.UserName)
						delete(r.clients, client)
						delete(r.clientStates, client)
						close(client.send)
					}
					// 非关键消息直接丢弃
				}
			}

		// 定时刷盘
		case <-r.flushTicker.C:
			r.flushToDB("定时")

		// 停止信号
		case <-r.stopChan:
			return
		}
	}
}

// sendSyncToClient 向新加入的客户端发送全量同步消息
// 包含其他用户的短暂状态（光标位置、选中组件）
func (r *Room) sendSyncToClient(client *Client) {
	snapshot, version := r.GetSnapshot()

	// 收集房间内其他用户信息（包含短暂状态）
	users := make([]UserInfo, 0, len(r.clients))
	for c := range r.clients {
		if c != client {
			userInfo := c.UserInfo
			// 附加用户的短暂状态
			if state, ok := r.clientStates[c]; ok {
				userInfo.State = state
			}
			users = append(users, userInfo)
		}
	}

	syncPayload := SyncPayload{
		Schema:     snapshot,
		Version:    version,
		Users:      users,
		CanvasSize: r.GetCanvasSize(),
	}

	payload, _ := json.Marshal(syncPayload)
	msg := WSMessage{
		Type:      TypeSync,
		SenderID:  "server",
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}

	data, _ := json.Marshal(msg)
	client.send <- data

	log.Printf("[Room %s] 已发送 Sync 给 [%s], 版本: %d, 其他用户: %d",
		r.ID, client.UserInfo.UserName, version, len(users))
}

// broadcastUserJoin 广播用户加入消息（发给除新用户外的所有人）
func (r *Room) broadcastUserJoin(client *Client) {
	payload, _ := json.Marshal(client.UserInfo)
	msg := WSMessage{
		Type:      TypeUserJoin,
		SenderID:  client.UserInfo.UserID,
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}
	data, _ := json.Marshal(msg)

	for c := range r.clients {
		if c != client {
			select {
			case c.send <- data:
			default:
				// 非关键消息，静默跳过
			}
		}
	}
}

// broadcastUserLeave 广播用户离开消息（清理死光标）
func (r *Room) broadcastUserLeave(client *Client) {
	payload, _ := json.Marshal(client.UserInfo)
	msg := WSMessage{
		Type:      TypeUserLeave,
		SenderID:  client.UserInfo.UserID,
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}
	data, _ := json.Marshal(msg)

	for c := range r.clients {
		select {
		case c.send <- data:
		default:
			// 非关键消息，静默跳过
		}
	}
}

// --- 对外接口 ---

// ErrRoomClosed 房间已关闭错误
var ErrRoomClosed = fmt.Errorf("room is closing")

// Register 将客户端注册到房间。
// 采用非阻塞方式，防止向已关闭的房间注册。
func (r *Room) Register(client *Client) error {
	select {
	case r.register <- client:
		return nil
	case <-r.stopChan:
		return ErrRoomClosed
	}
}

// Unregister 将客户端从房间注销（非阻塞）
func (r *Room) Unregister(client *Client) {
	select {
	case r.unregister <- client:
	case <-r.stopChan:
		// 房间已关闭，无需注销
	}
}

// Broadcast 向房间内广播消息
func (r *Room) Broadcast(message []byte, sender *Client, isCritical bool) {
	r.broadcast <- &RoomBroadcast{
		Message:    message,
		Sender:     sender,
		IsCritical: isCritical,
	}
}

// Stop 停止房间并阻塞等待刷盘完成。
// 确保"先刷盘再移除"的顺序，由 Hub 调用。
func (r *Room) Stop() {
	r.countMu.Lock()
	if r.stopping {
		r.countMu.Unlock()
		<-r.doneChan
		return
	}
	r.stopping = true
	r.countMu.Unlock()

	close(r.stopChan)
	<-r.doneChan
}

// StopWithReason 带原因停止房间，用于页面删除场景。
// 会先广播错误消息通知所有客户端。
func (r *Room) StopWithReason(reason ErrorCode, message string) {
	r.countMu.Lock()
	if r.stopping {
		r.countMu.Unlock()
		<-r.doneChan
		return
	}
	r.stopping = true
	r.countMu.Unlock()

	// 广播错误消息给所有客户端
	r.broadcastError(reason, message)

	// 等待消息发送
	time.Sleep(100 * time.Millisecond)

	close(r.stopChan)
	<-r.doneChan
}

// broadcastError 向所有客户端广播错误消息
func (r *Room) broadcastError(code ErrorCode, message string) {
	errPayload, _ := json.Marshal(ErrorPayload{
		Code:    code,
		Message: message,
	})
	msg := WSMessage{
		Type:      TypeError,
		SenderID:  "server",
		Payload:   errPayload,
		Timestamp: time.Now().UnixMilli(),
	}
	data, _ := json.Marshal(msg)

	r.broadcast <- &RoomBroadcast{
		Message:    data,
		Sender:     nil,
		IsCritical: true,
	}
}

// ClientCount 返回当前客户端数量，供 Hub 双重检查使用
func (r *Room) ClientCount() int {
	r.countMu.RLock()
	defer r.countMu.RUnlock()
	return r.clientCount
}

// IsStopping 返回房间是否正在停止
func (r *Room) IsStopping() bool {
	r.countMu.RLock()
	defer r.countMu.RUnlock()
	return r.stopping
}

// updateClientCount 更新客户端计数，供 run() 内部调用
func (r *Room) updateClientCount(delta int) {
	r.countMu.Lock()
	r.clientCount += delta
	r.countMu.Unlock()
}

// SetCanvasSize 设置画布大小
func (r *Room) SetCanvasSize(size *CanvasSize) {
	r.canvasMu.Lock()
	r.CanvasSize = size
	r.canvasMu.Unlock()
}

// GetCanvasSize 获取画布大小
func (r *Room) GetCanvasSize() *CanvasSize {
	r.canvasMu.RLock()
	defer r.canvasMu.RUnlock()
	return r.CanvasSize
}

// --- 需要锁保护的状态操作 ---

// ApplyPatch 应用 JSON Patch 到当前状态。
// 包含版本检查，确保乐观锁机制生效。
func (r *Room) ApplyPatch(patchBytes []byte, expectedVersion int64) error {
	r.stateMu.Lock()
	defer r.stateMu.Unlock()

	if r.Version != expectedVersion {
		return &VersionConflictError{
			CurrentVersion:  r.Version,
			ExpectedVersion: expectedVersion,
		}
	}

	patch, err := jsonpatch.DecodePatch(patchBytes)
	if err != nil {
		return &PatchError{Reason: fmt.Sprintf("patch 解析失败: %v", err)}
	}

	modified, err := patch.Apply(r.CurrentState)
	if err != nil {
		return &PatchError{Reason: fmt.Sprintf("patch 应用失败: %v", err)}
	}

	r.CurrentState = modified
	r.Version++

	// 达到阈值时触发刷盘
	if r.Version-r.lastPersistedVersion >= FlushThreshold {
		go r.flushToDB("阈值触发")
	}

	return nil
}

// GetSnapshot 获取当前状态快照，返回拷贝以保证并发安全
func (r *Room) GetSnapshot() ([]byte, int64) {
	r.stateMu.RLock()
	defer r.stateMu.RUnlock()

	snapshot := make([]byte, len(r.CurrentState))
	copy(snapshot, r.CurrentState)

	return snapshot, r.Version
}

// flushToDB 将当前状态持久化到数据库
func (r *Room) flushToDB(reason string) {
	r.stateMu.RLock()
	if r.Version == r.lastPersistedVersion {
		r.stateMu.RUnlock()
		return
	}

	snapshot := make([]byte, len(r.CurrentState))
	copy(snapshot, r.CurrentState)
	currentVersion := r.Version
	lastVersion := r.lastPersistedVersion
	r.stateMu.RUnlock()

	if err := r.pageService.SavePageState(r.ID, snapshot, lastVersion, currentVersion); err != nil {
		log.Printf("[Room %s] %s刷盘失败: %v", r.ID, reason, err)
		return
	}

	r.stateMu.Lock()
	if currentVersion > r.lastPersistedVersion {
		r.lastPersistedVersion = currentVersion
		log.Printf("[Room %s] %s刷盘完成, 版本: %d -> %d", r.ID, reason, lastVersion, currentVersion)
	}
	r.stateMu.Unlock()
}
