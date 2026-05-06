# AGENTS.md

## 作用

本仓库是一个基于 `pnpm workspace` 的低代码编辑器 monorepo。

这份文件不是功能说明书，而是仓库级协作约定。它的目标是把 AI 工作流真正落进工程体系，而不是只停留在聊天里。

核心原则：

- 规则写进仓库，不靠临场记忆
- 大改先写计划，不靠聊天上下文续命
- 完成不等于“代码看起来差不多”，而是“实现 + 验证 + review + 沉淀”
- 跨包契约当成真实边界处理
- 重要经验沉淀到 repo，而不是沉淀在聊天历史

这份约定参考了 `AI工作流/openai-agents-python.md` 提炼出的思路，但会按本仓库的规模和结构做轻量化落地。

## 事实优先级

出现冲突时，按以下顺序判断：

1. 代码与测试
2. 本文件 `AGENTS.md`
3. 根目录 `index.md`
4. `docs/index.md`
5. `docs/architecture/` 中的当前架构文档
6. `docs/plans/active/` 中的当前活计划
7. `docs/research/`、`docs/archive/`、`docs/showcase/` 中的历史材料

`.agent/` 和 `.codex/` 下已有规则、技能和工作流仍然有参考价值，但本文件是仓库级总入口。

## 仓库结构

### 核心包

- `packages/schema`
  - 共享类型、协议、IR、plugin/publisher/solution 等契约层
- `packages/expression`
  - 表达式引擎，负责求值、依赖提取、上下文类型与运行时类型守卫
- `packages/materials`
  - 物料实现、meta、生成脚本、物料测试
- `packages/renderer`
  - 纯渲染核心，负责 schema 到 React 渲染，以及运行时表达式 prop 求值
- `packages/code-generator`
  - 从 schema 到项目代码的生成流水线
- `packages/editor`
  - 编辑器主应用、store、simulator、iframe 通信、交互编排

### 核心文档

- `docs/index.md`
  - 文档系统入口和放置规则
- `docs/architecture/`
  - 长期稳定的架构认知
- `docs/product/`
  - 产品定位、路线图、项目价值表达
- `docs/plans/active/`
  - 当前正在推进的执行计划
- `docs/plans/archive/`
  - 已完成或废弃的计划归档
- `docs/research/`
  - 调研、对标、探索
- `docs/archive/`
  - 历史方案和非主线资料
- `docs/showcase/`
  - 面试、简历、课程、演示材料
- `docs/superpowers/`
  - 工具工作流保留区，不作为人工主文档树

## 工作原则

### 1. 先写 spec，再写代码

以下情况不要直接改代码，先写一份轻量 spec：

- 改公开导出类型或协议结构
- 改 renderer 的输入输出或核心行为
- 改 codegen 输出结构
- 改 simulator / iframe 通信
- 改构建、测试、workspace、TypeScript project references
- 涉及多个 package 或多个子系统联动

spec 不需要很重，但至少写清楚：

- 背景问题
- 目标结果
- 非目标
- 影响范围
- 兼容性风险
- 验证方式

建议位置：

- 如果后续建立了 `docs/specs/`，优先放那里
- 否则和当前活计划一起维护，或按工具要求写到对应 spec 目录

### 2. 大改先写计划

复杂任务不能只靠聊天记忆。

满足以下任一条件时，先写或更新计划：

- 预计超过 1 小时
- 改动超过 5 个文件
- 影响超过 1 个 package
- 涉及重构、迁移、删除、重命名、移动模块
- 涉及共享契约
- 有明显回滚风险

默认放置：

- 进行中的计划：`docs/plans/active/`
- 已完成或失效的计划：`docs/plans/archive/`

每份计划尽量自包含，至少包含：

- Context
- Goal
- Non-Goals
- Milestones
- Verification
- Progress
- Discoveries
- Decision Log
- Outcomes / Retrospective

参考模板：

- `docs/plans/TEMPLATE.md`

### 2.5 复杂调研任务先读入口文档

遇到以下任务，不要一上来就全仓库乱搜，先读入口文档建立全局模型：

- 第一次接手本项目
- 需求跨多个 package
- 需要调研现有架构再决定方案
- 需要判断影响范围、依赖方向或兼容性边界
- 需要快速定位“这件事应该改哪一层”

推荐阅读顺序：

1. 根目录 `index.md`
2. `docs/index.md`
3. `docs/architecture/architecture_summary_2.md`
4. 与当前任务最相关的 `docs/architecture/` 专题文档
5. 如任务仍在推进，再看 `docs/plans/active/`

目标不是把文档全读完，而是先用最少 token 建立：

- 六包职责
- 核心数据流
- 设计态 / 运行态 / 出码态的边界
- 哪些地方是高风险契约面

入口职责区分：

- 根目录 `index.md`
  - 项目总入口，负责快速建立项目结构、依赖方向和核心链路模型
- `docs/index.md`
  - 文档系统入口，负责快速定位应该读哪类文档、把新文档放到哪里

### 3. review 作为默认动作

不是“有人要求 review 才 review”，而是每次实现完成前，默认做一次 review。

本仓库 review 优先级：

1. 契约有没有漂移
2. 依赖方向有没有反转
3. 有没有把 editor 状态或交互逻辑偷偷耦合进 renderer / schema
4. 行为变化有没有被验证
5. 测试和文档有没有漏

涉及重构、移动、删除、重命名时，必须额外检查：

- 死 import
- 死依赖
- 新依赖是否声明
- exports 是否过期
- 路径引用是否失效

`.agent/rules/refactor-hygiene.md` 对这类场景是必读输入，不是可选参考。

### 4. 任务要小且可验证

不要把任务写成“统一 renderer”“清理 codegen”这种大而虚的目标。

每个 milestone 都应该满足：

- 只负责一个明确结果
- 范围尽量窄
- 带验证命令或证明步骤

好的 milestone 示例：

- preview 改为消费 `@lowcode/renderer`，且 preview 相关测试通过
- renderer 输入契约冻结，所有调用点类型检查通过
- 旧 preview 递归渲染路径被移除，且 build 仍然通过

### 5. 经验必须回写仓库

不要把关键 reasoning 只留在聊天里。

任务产生了可复用经验后，至少要落到这些地方之一：

- `docs/architecture/`
- `docs/plans/archive/`
- 未来的架构决策文档
- `docs/research/`，如果结论还在探索期

至少补这几件事：

- 这次改了什么
- 为什么这样改
- 过程中发现了什么风险
- 下次应该复用什么、避免什么

## 高风险边界

下面这些区域视为高风险契约面。

改这些地方时，通常需要先写 spec，再写 plan：

- `packages/schema` 的公开导出
- `packages/expression` 的求值策略、上下文层级、依赖提取与订阅模型
- 共享协议和 IR 结构
- renderer props、render mode、hook 注入点
- materials 的 meta 结构，以及与 codegen 相关的物料契约
- code-generator 的 plugin、publisher、solution、template 契约
- simulator host 与 iframe 通信协议
- 根 `tsconfig.json` 的 project references
- workspace 的 build、test、lint、postinstall 行为

这里要特别注意：

- 在这个仓库里，位置、接线方式、数据流方向本身就是契约
- 不是“类型还能对上”就算安全
- 技术上能改，不代表工程上应该改

## 包边界约束

### `packages/schema`

- 这里是共享契约层
- 尽量保持轻量，避免塞入重运行时行为
- 改动通常会波及其余所有包

### `packages/materials`

- 物料实现和 meta 归这里
- 面向 generator 的假设要显式，不要藏在隐式约定里
- 物料结构改动时，要联查 renderer 和 code-generator 的影响

### `packages/renderer`

- 必须保持为渲染核心，不要演化成 editor 状态容器
- 禁止把 editor store 直接拉进 renderer
- 表达式上下文必须通过 props / 注入点进入 renderer，不要反向 import editor store
- design-only 能力优先通过注入点扩展，而不是靠反向耦合硬塞进去

### `packages/code-generator`

- 输出结果本身就是契约
- plugin、template、publisher 的改动必须验证，不能凭感觉说“应该没事”
- 非 trivial 变更优先用 snapshot 或输出结构校验

### `packages/editor`

- 编辑器专属编排逻辑放这里
- simulator、UI、拖拽、mask、action orchestration 等能力不要随意下沉到 renderer，除非这次任务明确在做边界重设
- `packages/editor/tsconfig.json` 目前对 `materials` / `renderer` / `code-generator` 使用 `paths` 直接映射源码入口，而不是 project references
- 原因：这三个包在开发态没有稳定的 `.d.ts` 产物链，直接加 project references 会触发 TS6305；只有 `schema` 与 `expression` 保持 project references

## 默认验证

仓库级默认验证命令：

```bash
pnpm -r exec tsc --noEmit
pnpm -r test
pnpm build
pnpm lint
```

日常迭代时可以先跑最小相关子集，但在以下场景下，结束前应尽量跑全套：

- 改了包边界
- 改了共享契约
- 改了构建或测试配置
- 改了 renderer、codegen、editor 的核心链路

按区域补充验证：

- `packages/materials`
  - 跑对应物料测试
- `packages/expression`
  - 跑表达式引擎单测和 build / 类型检查
- `packages/renderer`
  - 验证 preview / simulator 相关渲染路径
- `packages/code-generator`
  - 跑 generator 测试和输出结构校验
- `packages/editor`
  - 影响到 store、simulator、交互逻辑时补对应测试

如果没法跑验证，要明确说明原因，不要假装这一步不存在。

## 文档约定

新增或修改文档前，先看：

- 根目录 `index.md`
- `docs/index.md`

默认放置规则：

- 长期稳定架构认知 -> `docs/architecture/`
- 产品方向和价值表达 -> `docs/product/`
- 进行中的执行计划 -> `docs/plans/active/`
- 已完成或废弃计划 -> `docs/plans/archive/`
- 探索性调研 -> `docs/research/`
- 历史或非主线资料 -> `docs/archive/`
- 面试、简历、课程、演示材料 -> `docs/showcase/`

不要再往 `docs/` 根目录直接堆零散文档，除非这个文件本身就是根入口。

## 完成定义

不是“代码已经写完”就算完成。

满足以下条件，才算完成：

- 需要 spec 的任务，spec 已存在
- 需要 plan 的任务，plan 已建立或更新
- 代码实现已经完成
- 验证已执行，或明确说明了验证缺口
- 默认 review 已完成
- 该沉淀到 repo 的经验已经落文档

## 推荐协作风格

- 尽量守住包边界，除非这次任务明确在重设边界
- 优先显式契约，少靠隐式耦合
- 优先小步推进，少做无保护的大重写
- 优先可验证 milestone，少做长时间无证据推进
- 优先把经验写进仓库，少把关键知识留在聊天历史
