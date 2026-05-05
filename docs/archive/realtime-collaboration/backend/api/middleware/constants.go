package middleware

// ContextKey 定义 Context 中使用的常量 key
// 避免在代码中硬编码字符串，防止拼写错误导致的 bug

const (
	// ContextKeyUserID 存储 Clerk 用户 ID 的 Context key
	ContextKeyUserID = "userID"
)
