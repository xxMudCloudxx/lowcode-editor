# Claude Code 项目指引

**首先阅读：** [index.md](index.md) — 包结构、核心架构、常用命令全在里面。

---

## 开始任务前

- 涉及 Simulator 通信的任务：先读 `packages/editor/src/editor/simulator/protocol.ts`
- 涉及状态管理的任务：先读 `packages/editor/src/editor/stores/` 下对应的 store
- 涉及物料的任务：先看一个现有物料（如 `packages/materials/src/General/Button/`）再动手

## 代码约定

- 三个 Store 职责严格分离，不要把 UI 状态写进 `useComponentsStore`
- 新增物料只需创建三个文件（dev / prod / meta），不修改注册代码
- Host 是唯一 Master，不要在 Renderer 侧直接修改 Store
- `useUIStore` 不接 persist，不要给它加持久化

## 测试

```bash
pnpm test                        # 全部
pnpm --filter @lowcode/editor test   # 仅 editor 包
```

测试框架：Vitest + Testing Library。
