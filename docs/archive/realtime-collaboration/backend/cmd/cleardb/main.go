package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"lowercode-go-server/bootstrap"
	"lowercode-go-server/domain/entity"

	"github.com/joho/godotenv"
)

func main() {
	// 命令行参数
	force := flag.Bool("force", false, "跳过确认提示，强制执行清库")
	truncate := flag.Bool("truncate", false, "使用 TRUNCATE（更快，会重置自增ID）")
	tables := flag.String("tables", "", "指定要清空的表，逗号分隔（例如: pages,users）；留空表示清空所有表")
	flag.Parse()

	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("[ClearDB] 未找到 .env 文件，使用系统环境变量")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("[ClearDB] DATABASE_URL 环境变量未设置")
	}

	// 连接数据库
	db := bootstrap.NewDatabase(dsn)

	// 确认提示
	if !*force {
		fmt.Println("警告：此操作将删除数据库中的所有数据！")
		fmt.Println("受影响的表：")

		targetTables := getAllTables()
		if *tables != "" {
			targetTables = parseTableNames(*tables)
		}
		for _, t := range targetTables {
			fmt.Printf("   - %s\n", t)
		}

		fmt.Print("\n确认执行清库操作？(yes/no): ")
		reader := bufio.NewReader(os.Stdin)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(strings.ToLower(input))

		if input != "yes" && input != "y" {
			fmt.Println("操作已取消")
			return
		}
	}

	// 执行清库
	fmt.Println("\n开始清库...")

	targetTables := getAllTables()
	if *tables != "" {
		targetTables = parseTableNames(*tables)
	}

	for _, tableName := range targetTables {
		var err error
		if *truncate {
			err = db.Exec(fmt.Sprintf("TRUNCATE TABLE %s RESTART IDENTITY CASCADE", tableName)).Error
		} else {
			err = db.Exec(fmt.Sprintf("DELETE FROM %s", tableName)).Error
		}

		if err != nil {
			log.Printf("[ClearDB] 清空表 %s 失败: %v\n", tableName, err)
		} else {
			log.Printf("[ClearDB] 已清空表: %s\n", tableName)
		}
	}

	fmt.Println("\n清库操作完成！")
}

// getAllTables 返回所有需要清空的表名
// 注意：顺序很重要！先删除有外键依赖的表
func getAllTables() []string {
	return []string{
		getTableName(&entity.Page{}),
		getTableName(&entity.User{}),
	}
}

// getTableName 获取实体对应的表名
func getTableName(model interface{}) string {
	switch model.(type) {
	case *entity.Page:
		return "pages"
	case *entity.User:
		return "users"
	default:
		return ""
	}
}

// parseTableNames 解析命令行指定的表名
func parseTableNames(input string) []string {
	parts := strings.Split(input, ",")
	var tables []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			tables = append(tables, p)
		}
	}
	return tables
}
