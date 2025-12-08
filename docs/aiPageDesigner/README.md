# AI 页面生成系统技术文档

> 本文档用于技术审查，详细描述了低代码编辑器中 AI 页面生成功能的架构设计、核心流程与实现细节。

## 目录

1. [系统概述](./01-overview.md)
2. [架构设计](./02-architecture.md)
3. [数据流与接口](./03-data-flow.md)
4. [Prompt 工程](./04-prompts.md)
5. [Linter 后处理器](./05-linter.md)
6. [物料系统](./06-materials.md)
7. [待改进项](./07-improvements.md)

---

## 快速导航

| 文件                                       | 描述                                       |
| ------------------------------------------ | ------------------------------------------ |
| [01-overview.md](./01-overview.md)         | 系统功能概述、技术栈、核心特性             |
| [02-architecture.md](./02-architecture.md) | 三阶段管道架构、模块职责划分               |
| [03-data-flow.md](./03-data-flow.md)       | API 接口定义、数据结构、请求响应流程       |
| [04-prompts.md](./04-prompts.md)           | Prompt 设计策略、模板结构、CoT 思维链      |
| [05-linter.md](./05-linter.md)             | 语义修正器原理、父子约束规则、属性上浮机制 |
| [06-materials.md](./06-materials.md)       | 物料元数据格式、Core+Recall 策略           |
| [07-improvements.md](./07-improvements.md) | 已知问题、优化建议、未来规划               |

---

## 源码路径索引

```
server/
├── index.ts              # 主入口，API 路由与生成管道
├── schemas.ts            # Zod Schema 定义（语法校验）
├── linter.ts             # 语义修正器（父子约束修复）
├── prompts/
│   ├── intent_system.md  # Phase 1: 意图分析提示词
│   ├── schema_role.md    # Phase 2: 黄金规则定义
│   └── schema_system_template.md  # Phase 2: Schema 生成模板
└── template/
    ├── materials-ai.json    # AI 优化的物料元数据
    └── component-names.json # 组件名枚举（Zod 校验用）
```
