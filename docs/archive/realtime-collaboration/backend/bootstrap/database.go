package bootstrap

import (
	"log"
	"os"
	"time"

	"lowercode-go-server/domain/entity"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewDatabase 创建并配置 PostgreSQL 数据库连接
// dsn 格式: postgres://user:password@localhost:5432/dbname?sslmode=disable
func NewDatabase(dsn string) *gorm.DB {
	// 根据环境设置日志级别
	logLevel := logger.Info
	if os.Getenv("GIN_MODE") == "release" {
		logLevel = logger.Warn // 生产环境只记录警告和错误
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 连接池配置
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("获取数据库实例失败: %v", err)
	}

	// 空闲连接池配置
	sqlDB.SetMaxIdleConns(10)
	// 最大连接数（PostgreSQL 默认 max_connections=100）
	sqlDB.SetMaxOpenConns(100)
	// 连接最大存活时间
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 自动迁移表结构
	if err := db.AutoMigrate(&entity.Page{}, &entity.User{}); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	log.Println("[Database] PostgreSQL 连接成功，表结构已同步")
	return db
}
