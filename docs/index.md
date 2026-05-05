# Docs Index

这份文档不是目录清单，而是本项目的“一页建模入口”。

目标：

- 让人或智能体用尽量少的 token 快速理解项目结构
- 先建立正确的系统模型，再决定去读哪份深层文档
- 避免一上来就在全仓库做低效搜索

如果任务复杂、跨包、需要先调研现状，请先读这份文档，再进入具体专题文档。

---

## 30 秒建立项目模型

一句话描述：

这是一个基于 `pnpm workspace` 的低代码编辑器 monorepo，核心由 5 个 package 组成，围绕三条主链路协作：

1. 编辑链路：拖拽编排、属性配置、状态管理、iframe 同步
2. 渲染链路：schema -> materials -> renderer -> preview / simulator
3. 出码链路：schema -> IR -> solution / plugins -> 完整前端工程

最重要的理解方式：

- `schema` 定义规则
- `materials` 提供物料
- `renderer` 负责纯渲染
- `editor` 负责编排和交互
- `code-generator` 负责把 schema 变成真实项目代码

---

## 五包职责总览

### `packages/schema`

定位：共享契约层。

这里定义：

- 组件节点结构
- 物料协议
- 配置面板描述
- 出码相关 IR / plugin / publisher / solution 契约

可以把它理解成全系统共同遵守的“法律层”。

### `packages/materials`

定位：物料层。

这里放：

- 组件物料实现
- `meta` 描述
- 物料自动注册逻辑
- 与第三方组件库集成的元数据生成脚本

可以把它理解成“低代码世界里的组件生态”。

### `packages/renderer`

定位：纯渲染核心。

职责：

- 接收 schema 和物料映射
- 生成 React 渲染结果
- 同时服务设计态画布、预览态和潜在运行态

关键约束：

- 这里不是 editor 状态容器
- 不应该直接依赖 editor store

### `packages/code-generator`

定位：出码引擎。

职责：

- 解析 schema
- 转换为 IR
- 通过 solution / plugins 生成完整项目文件

可以把它理解成“从低代码描述到真实工程代码的编译器”。

### `packages/editor`

定位：编辑器主应用。

职责：

- 维护组件树和 UI 状态
- 提供拖拽、选中、属性配置、事件配置
- 维护 simulator / iframe 通信
- 组织 preview、历史记录、交互编排

可以把它理解成“真正给用户操作的设计器外壳”。

---

## 依赖方向

用一行记住依赖拓扑：

`schema <- materials <- renderer <- editor`

同时：

`schema <- code-generator <- editor`

理解要点：

- `schema` 在最底层，是共享契约基础
- `editor` 在最上层，是最终编排者
- `renderer` 和 `code-generator` 都是能力层，不应该反向吞入 editor 的状态逻辑

如果你准备改代码，先问自己一句：

“我现在改的是契约层、能力层，还是编排层？”

---

## 三条主链路

### 1. 编辑链路

用户在编辑器里拖拽、选中、配置属性、绑定事件，最终修改的是组件树和 UI 状态。

你可以这样理解：

- 用户操作发生在 `editor`
- 核心业务状态保存在 store
- 变更通过 simulator 协议同步到 iframe
- iframe 侧只负责展示和交互回传

这条链路的关键词：

- store
- history
- patch
- simulator
- iframe

### 2. 渲染链路

组件树本身不会直接渲染成 UI，必须经过共享契约、物料映射和纯渲染层。

理解顺序：

1. schema 描述页面结构
2. materials 提供组件实现和行为元信息
3. renderer 负责把结构变成 React 渲染结果
4. editor/preview/simulator 作为不同消费方承接渲染结果

这条链路的关键词：

- schema
- materials
- renderer
- design mode
- preview

### 3. 出码链路

低代码平台不只要“搭得出来”，还要“导得出去”。

理解顺序：

1. schema 作为输入
2. parser 转成 IR
3. solution 决定目标工程类型
4. plugins 逐层生成组件代码、项目代码和附属文件
5. publisher 输出最终结果

这条链路的关键词：

- parser
- IR
- solution
- plugin
- publisher

---

## 状态与数据流的最小理解

如果你只记一件事，请记住：

主状态在 `editor` 侧，iframe 不是主真相源。

也就是说：

- Host 是主写端
- Iframe 是渲染和交互代理
- 写操作原则上回到 Host 执行

这能帮助你快速判断：

- 为什么很多通信是单向同步 + 事件回传
- 为什么 patch / version / snapshot 机制重要
- 为什么 renderer 需要保持纯净

---

## 高风险区域

以下区域改动前，通常应该先读专题文档，再决定怎么动：

- `packages/schema`
  - 一改就可能波及所有包
- `packages/renderer`
  - 容易误把 editor 逻辑耦合进去
- `packages/code-generator`
  - 输出结果本身就是契约
- `packages/editor/src/editor/simulator/`
  - 涉及 iframe 通信、增量同步、版本一致性
- 根 `tsconfig.json`
  - 影响 monorepo project references

如果任务涉及这些区域，建议再读：

- `architecture/architecture_summary_2.md`
- 相关专题架构文档
- `plans/active/` 里的当前计划

---

## 按任务找入口

### 我想快速理解项目整体结构

先读：

1. 本文
2. `architecture/architecture_summary_2.md`

### 我想改渲染或 preview / simulator

先读：

1. 本文中的“渲染链路”和“状态与数据流”
2. `architecture/architecture_summary_2.md`
3. `architecture/` 下与 renderer / iframe / simulator 相关文档

### 我想改物料系统

先读：

1. 本文中的“五包职责总览”
2. `architecture/architecture_summary_2.md`
3. `packages/materials` 相关文档和测试

### 我想改出码系统

先读：

1. 本文中的“出码链路”
2. `architecture/architecture_summary_2.md`
3. `packages/code-generator` 相关计划或研究文档

### 我想判断一项需求会影响哪些层

先读：

1. 本文中的“依赖方向”“三条主链路”“高风险区域”
2. 再决定要不要进入深层文档或源码

---

## 文档地图

### `architecture/`

放长期稳定的架构认知，回答“这个项目现在是怎么工作的”。

适合放：

- 包职责边界
- 核心数据流
- 渲染、simulator、codegen 的机制
- 已经沉淀稳定的技术方案

不适合放：

- 一次性执行步骤
- 过时草稿

### `product/`

放产品定位、路线图、项目价值表达，回答“这个项目为什么值得做”。

### `plans/active/`

放当前仍在推进的计划，回答“这次准备怎么做”。

要求：

- 只保留活跃计划
- 做完后迁到 `plans/archive/`
- 每份计划都要带验证方式

### `plans/archive/`

放已完成、取消或失效的计划，用于追溯，不占主视野。

### `research/`

放调研、对标、探索。

注意：

- 研究文档默认不是最终架构结论
- 结论成熟后再提炼到 `architecture/`

### `showcase/`

放面试、简历、课程、演示材料。

这些内容有价值，但不应该和工程主文档混在一起。

### `archive/`

放历史方案、旧原型和不再属于当前主线的资料。

当前已归档：

- `archive/realtime-collaboration/`

### `superpowers/`

这是工具工作流保留区。

约定：

- 保持现状
- 不作为人工主文档树
- `superpowers/plans/` 属于工具默认行为，不参与主 docs 架构治理

---

## 新文档该放哪

新增文档前，先判断它属于哪一类：

- 长期稳定架构认知 -> `architecture/`
- 产品方向和价值表达 -> `product/`
- 动手前规格 -> 优先按工具流程进入 spec 目录，或后续独立 `specs/`
- 执行中的计划 -> `plans/active/`
- 已完成任务的计划和复盘 -> `plans/archive/`
- 外部调研和内部探索 -> `research/`
- 面试/简历/课程材料 -> `showcase/`
- 已废弃或停更资料 -> `archive/`

不要再往 `docs/` 根目录直接堆零散文档。

---

## 命名与维护规则

- 目录名优先使用英文小写和 `kebab-case`
- 文件名尽量表达主题，不再使用 `summary_2`、`final-new` 这类弱语义命名
- 如果要保留中文标题，优先保留在文档 H1，文件名尽量稳定
- `docs/` 根目录默认只保留 `index.md` 和一级目录
- 源码、测试代码、二进制原则上不放 `docs/`；历史遗留必须进 `archive/`
- 重要经验要沉淀到 repo，不要只留在聊天历史

---

## 继续深入时读什么

如果这份入口文档还不够，请按下面顺序深入：

1. `architecture/architecture_summary_2.md`
2. 当前任务直接相关的 `architecture/` 专题文档
3. 当前仍在推进的 `plans/active/`
4. 需要历史背景时，再看 `research/` 或 `archive/`

原则：

- 先建立系统模型
- 再缩小到具体子系统
- 最后才进入大范围源码搜索
