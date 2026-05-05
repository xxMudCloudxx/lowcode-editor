# Docs Index

`docs/` 只存放项目文档资产，不再把零散计划、研究记录、简历素材和历史原型混放在根目录。

## Read This First

如果你第一次进入这个项目，建议按下面顺序阅读：

1. `architecture/`
   - 先理解系统分层、核心链路和关键技术方案。
2. `product/`
   - 再看项目定位、升级方向和对外表达。
3. `plans/active/`
   - 最后看当前正在推进的事项，而不是一上来就看历史计划。

## Directory Guide

### `architecture/`

放长期稳定的系统认知，重点回答“这个项目现在是怎么工作的”。

适合放：

- 包职责边界
- 渲染链路
- iframe / simulator / codegen 的核心机制
- 长期有效的架构总结

不适合放：

- 一次性的执行步骤
- 已经过时的探索草稿

### `product/`

放产品定位、路线图、项目价值和业务表达，重点回答“这个项目为什么值得做”。

### `plans/active/`

放当前仍在推进的计划文档，重点回答“这次准备怎么做”。

要求：

- 只保留仍然活跃的计划
- 做完后及时迁到 `plans/archive/`
- 每个计划必须写验证方式

### `plans/archive/`

放已经完成、取消或失效的计划，保留追溯价值，但不占用主视野。

### `research/`

放对外部方案的研究、对标和内部探索。

要求：

- 研究文档默认不是正式架构结论
- 结论成熟后，再提炼到 `architecture/` 或后续的决策文档

### `showcase/`

放对外表达材料，包括：

- 面试素材
- 简历素材
- 演示课程
- 项目亮点总结

这些内容有价值，但不再和工程文档混放。

### `archive/`

放历史原型、旧方案和不再作为当前主线维护的资料。

当前已归档：

- `archive/realtime-collaboration/`

说明：

- 该目录包含历史协同方案、后端原型和相关资料
- 它保留参考价值，但不再作为当前 docs 主阅读路径的一部分

### `superpowers/`

这是工具工作流的保留区。

约定：

- 保持现状
- 不把它作为人工文档主目录使用
- `superpowers/plans/` 属于工具默认行为，不参与本次 docs 规范治理

## Placement Rules

新增文档前，先判断它属于哪一类：

- 长期稳定认知：放 `architecture/`
- 产品方向和价值：放 `product/`
- 动手前规格：优先放 `superpowers/specs/` 或后续独立 `specs/`
- 执行中的计划：放 `plans/active/`
- 做完后的复盘：放 `plans/archive/` 或后续独立 `retrospectives/`
- 外部调研和探索：放 `research/`
- 面试/简历/课程材料：放 `showcase/`
- 已废弃或停更的内容：放 `archive/`

## Naming Rules

- 目录名优先使用英文小写加 `kebab-case`
- 文件名尽量表达主题，不用 `summary_2`、`final-new` 这类不可持续命名
- 如果需要保留中文标题，优先保留在文档 H1，文件名尽量稳定

## Maintenance Rules

- `docs/` 根目录默认只保留 `index.md` 和一级分类目录
- 源码、测试代码、二进制文件原则上不放在 `docs/`；如果因为历史原因暂时保留，必须放到 `archive/`
- 重要经验要沉淀到 repo，而不是只留在聊天记录
- 文档迁移完成后，如果原路径已经失去意义，不要再把新文档放回旧位置
