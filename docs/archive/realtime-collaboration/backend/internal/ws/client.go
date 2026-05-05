package ws

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// 心跳配置
const (
	pongWait       = 60 * time.Second    // 等待 Pong 响应的最大时间
	pingPeriod     = (pongWait * 9) / 10 // Ping 发送间隔，必须小于 pongWait
	writeWait      = 10 * time.Second    // 写消息超时时间
	maxMessageSize = 512 * 1024          // 最大消息大小，防止恶意攻击
)

// Client 代表一个 WebSocket 客户端连接
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	RoomID   string
	UserInfo UserInfo
	Room     *Room       // 所属房间引用
	send     chan []byte // 发送消息缓冲区
}

// NewClient 创建客户端实例
func NewClient(hub *Hub, conn *websocket.Conn, roomID string, userInfo UserInfo) *Client {
	return &Client{
		Hub:      hub,
		Conn:     conn,
		RoomID:   roomID,
		UserInfo: userInfo,
		send:     make(chan []byte, 256),
	}
}

// WritePump 负责写消息和发送心跳 Ping
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)

	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))

			if !ok {
				// send channel 已关闭，发送关闭帧
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			// 定时发送 Ping 保活
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ReadPump 负责读消息和处理心跳 Pong
func (c *Client) ReadPump() {
	defer func() {
		if c.Room != nil {
			c.Room.Unregister(c)
		}
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))

	// 收到 Pong 时重置读超时
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[Client] 连接异常关闭: %v", err)
			}
			break
		}

		// 收到消息也重置读超时
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))

		var msg WSMessage
		json.Unmarshal(message, &msg)

		switch msg.Type {
		case TypeOpPatch:
			c.handleOpPatch(message)
		case TypeCursorMove:
			c.handleCursorMove(message)
		case TypeSelectionChange:
			c.handleSelectionChange(message)
		case TypeCanvasSize:
			var canvasSize CanvasSize
			if err := json.Unmarshal(message, &canvasSize); err != nil {
				log.Printf("[Client] 无效的画布大小消息: %v, 来自: %v", err, c.UserInfo.UserID)
				break
			}
			c.Room.SetCanvasSize(&canvasSize)

			c.Room.Broadcast(message, c, false)
		case TypeRequestSync:
			c.Room.syncRequest <- c
		}
	}
}

// handleOpPatch 处理增量编辑补丁消息
func (c *Client) handleOpPatch(message []byte) {
	if c.Room == nil {
		c.sendError(ErrRoomNotFound, c.RoomID)
		return
	}

	var wsMsg WSMessage
	json.Unmarshal(message, &wsMsg)

	var patchPayload struct {
		Patches json.RawMessage `json:"patches"`
		Version int64           `json:"version"`
	}
	json.Unmarshal(wsMsg.Payload, &patchPayload)

	// 应用 Patch，版本检查在锁保护下进行
	if err := c.Room.ApplyPatch(patchPayload.Patches, patchPayload.Version); err != nil {
		var versionErr *VersionConflictError
		var patchErr *PatchError

		switch {
		case errors.As(err, &versionErr):
			c.sendError(ErrVersionConflict, fmt.Sprintf("current: %d, expected: %d",
				versionErr.CurrentVersion, versionErr.ExpectedVersion))
		case errors.As(err, &patchErr):
			c.sendError(ErrPatchFailed, patchErr.Reason)
		default:
			c.sendError(ErrInternalError, err.Error())
		}
		log.Printf("[Client] Patch 处理失败: %v", err)
		return
	}

	// 广播给房间内其他用户（关键消息，阻塞时断开连接）
	c.Room.Broadcast(message, c, true)
	log.Printf("[Client] 用户 [%s] Patch 已应用，新版本: %d",
		c.UserInfo.UserName, c.Room.Version)
}

// handleCursorMove 处理光标移动消息
// 光标是非关键消息，阻塞时静默跳过
func (c *Client) handleCursorMove(message []byte) {
	if c.Room == nil {
		return
	}

	var wsMsg WSMessage
	json.Unmarshal(message, &wsMsg)

	var payload struct {
		CursorX float64 `json:"cursorX"`
		CursorY float64 `json:"cursorY"`
	}
	json.Unmarshal(wsMsg.Payload, &payload)

	// 使用指针字段进行部分更新（不会覆盖 SelectedComponentID）
	x, y := payload.CursorX, payload.CursorY
	update := &ClientStateUpdate{
		Client:  c,
		CursorX: &x,
		CursorY: &y,
		// SelectedComponentID 保持 nil，表示不修改
	}

	// 非阻塞发送：光标位置丢失一两帧没关系，避免阻塞读协程
	select {
	case c.Room.stateUpdate <- update:
	default:
		// 通道满，丢弃本次光标位置更新
	}

	// 重建消息，确保 SenderID 来自服务端已认证的用户信息
	broadcastMsg := WSMessage{
		Type:      TypeCursorMove,
		SenderID:  c.UserInfo.UserID, // 使用服务端可信的 UserID
		Payload:   wsMsg.Payload,
		Timestamp: time.Now().UnixMilli(),
	}
	data, _ := json.Marshal(broadcastMsg)
	c.Room.Broadcast(data, c, false)
}

// handleSelectionChange 处理组件选中变更消息
func (c *Client) handleSelectionChange(message []byte) {
	if c.Room == nil {
		return
	}

	var wsMsg WSMessage
	json.Unmarshal(message, &wsMsg)

	var payload struct {
		SelectedComponentID string `json:"selectedComponentId"`
	}
	json.Unmarshal(wsMsg.Payload, &payload)

	// 使用指针字段进行部分更新（不会覆盖光标位置）
	id := payload.SelectedComponentID
	update := &ClientStateUpdate{
		Client:              c,
		SelectedComponentID: &id,
		// CursorX/Y 保持 nil，表示不修改
	}

	// 选中状态是关键消息，使用阻塞发送确保不丢失
	c.Room.stateUpdate <- update

	// 重建消息，确保 SenderID 来自服务端已认证的用户信息
	broadcastMsg := WSMessage{
		Type:      TypeSelectionChange,
		SenderID:  c.UserInfo.UserID, // 使用服务端可信的 UserID
		Payload:   wsMsg.Payload,
		Timestamp: time.Now().UnixMilli(),
	}
	data, _ := json.Marshal(broadcastMsg)
	c.Room.Broadcast(data, c, true)
}

// sendError 发送结构化错误消息
func (c *Client) sendError(code ErrorCode, message string) {
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
	c.send <- data
}
