package errors

import "errors"

// 业务领域错误定义
// 所有业务逻辑相关的错误统一在此定义，避免跨包重复定义

// ErrPageNotFound 页面不存在错误
var ErrPageNotFound = errors.New("page not found in database")

// ErrOptimisticLock 乐观锁冲突错误
var ErrOptimisticLock = errors.New("optimistic lock error: version mismatch, please refresh and retry")

// ErrPageAlreadyExists 页面已存在错误
var ErrPageAlreadyExists = errors.New("page already exists")

// ErrUnauthorized 无权限错误
var ErrUnauthorized = errors.New("unauthorized: you don't have permission to perform this action")

// ErrRoomClosing 房间正在关闭错误，客户端应重试
var ErrRoomClosing = errors.New("room is closing, please retry")
