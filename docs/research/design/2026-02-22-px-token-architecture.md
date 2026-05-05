# 硬编码 px 令牌化治理 — 技术设计文档

## 1. 概述

### 问题陈述

`packages/editor/` 中大量组件使用硬编码 `px` 值（约 30+ 处可优化），与已有的设计令牌系统 (`tokens.ts` + `@theme` CSS 变量) 脱节。这导致：

- **一致性风险**：同一语义的间距/字号在不同文件中使用不同数值
- **可维护性差**：全局调整设计规格需要逐文件搜索替换
- **tokens.ts 空转**：`spacing`、`radius` 等令牌已定义，却未在组件中引用

### 解决方案摘要

采用 **Tailwind-first 混合策略**，按场景分层管理：

| 场景 | 方案 | 示例 |
|------|------|------|
| 静态布局样式 | Tailwind 工具类 | `className="gap-2 p-2 text-sm"` |
| 编辑器全局样式 | CSS 变量 (`@theme`) | `font-size: var(--text-sm)` |
| 动态/计算样式 | TS 常量引用 | `style={{ height: `${h}px` }}` (保留) |
| border: 1px | 硬编码 | 不改 |
| 背景图案 (点阵) | 硬编码 | 不改 |
| code-generator 输出 | 硬编码 | 不改 |

---

## 2. 架构决策

### Pattern: Tailwind-first + CSS Variable Fallback

**选择理由**：
1. 项目已重度使用 Tailwind v4 (`className="p-4 flex gap-2"` 随处可见)
2. Tailwind v4 原生支持 `@theme` 指令定义设计令牌，自动生成工具类
3. `tokens.ts` 的职责是喂给 Ant Design ConfigProvider，不应承担组件样式职责
4. 减少 `style={{}}` 内联写法可提升 React 渲染性能（减少对象创建）

**否决的方案**：
- ❌ 纯 CSS 变量方案：需要额外 `var()` 包裹，开发体验不如 Tailwind 类
- ❌ 纯 TS 常量方案：`tokens.spacing[2]` 仍是内联 style，没有解决根本问题
- ❌ 全部统一管理：`1px` border 和背景图案等低级视觉值不适合抽象

**Trade-offs**：
- 少量 Tailwind 任意值 `w-[340px]` 仍然存在（组件专属尺寸），可接受
- Renderer Mask 组件因在 iframe 中运行、使用动态定位，保留内联 style

---

## 3. 令牌扩展方案

### 3.1 扩展 `@theme` — 新增 spacing 和 font-size 令牌

当前 `@theme` 只定义了颜色、圆角、阴影。需要补充间距和字号令牌，使 Tailwind 的 spacing/text 工具类与设计系统对齐。

```css
/* index.css @theme 块新增 */
@theme {
  /* 已有: color, radius, shadow, font ... */

  /* =========================================================================
     间距比例尺 (4px 基准)
     ========================================================================= */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;

  /* =========================================================================
     字号比例尺
     ========================================================================= */
  --text-xs: 10px;    /* 面包屑角标 */
  --text-sm: 12px;    /* 辅助标签 */
  --text-base: 14px;  /* 正文 (编辑器默认) */
  --text-lg: 16px;    /* 空容器提示 */
}
```

> **同步策略**：`tokens.ts` 中的 `spacing` 对象值已与上述一致，文件顶部注释标记了双源同步义务（`⚠️ 技术债务`）。后续可通过构建脚本自动生成，但当前手动同步成本可控。

### 3.2 tokens.ts — 保持不变

`tokens.ts` 只服务于 Ant Design `ConfigProvider`，不新增职责。其 `spacing`/`radius` 等字段仅供 `antdTheme.ts` 消费。

---

## 4. 文件迁移清单

以下按文件列出所有需改动的硬编码 px，以及推荐的替代方案。

### 4.1 Editor 组件 (packages/editor/src/editor/)

#### `components/common/AttrListSetter/index.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L72 | `gap: "8px"` | `className="gap-2"` |
| L73 | `marginBottom: "8px"` | `className="mb-2"` |
| L74 | `padding: "4px"` | `className="p-1"` |
| L75 | `borderRadius: "4px"` | `className="rounded-sm"` |
| L87 | `gap: "8px"` (inline) | `className="flex grow gap-2 overflow-hidden"` |
| L202 | `padding: "8px"` | `className="p-2"` |
| L203 | `borderRadius: "6px"` | `className="rounded-md"` |
| L212 | `gap: "8px"` | `className="gap-2"` |
| L213 | `paddingBottom: "6px"` | `className="pb-1.5"` |
| L214 | `marginBottom: "6px"` | `className="mb-1.5"` |
| L219 | `width: "32px"` | `className="w-8 shrink-0"` |
| L220 | `gap: "8px"` | `className="flex grow gap-2"` |
| L226 | `fontSize: "12px"` | `className="text-sm"` |
| L237 | `width: "32px"` | `className="w-8 shrink-0"` |
| L267 | `marginTop: "8px"` | `className="mt-2"` |

#### `components/common/StyleOptionGroup/index.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L53 | `borderRadius: "6px"` | `className="rounded-md"` |

#### `components/common/LoadingPlaceholder/index.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L34 | `minHeight: "100px"` | `className="min-h-[100px]"` (组件专属) |

#### `components/Setting/ComponentBreadcrumb/index.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L79 | `fontSize: "10px"` | `className="text-xs"` |

#### `components/Setting/ComponentAttr/BreadcrumbSetter/index.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L49 | `gap: "12px"` | `className="flex flex-col gap-3"` |

#### `components/Setting/ComponentEvent/actions/CustomJs.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L65 | `height={"300px"}` | 保留 (Monaco Editor 组件专属尺寸) |

#### `components/SimulatorView/index.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L47 | `boxShadow: "0 4px 24px..."` | `className="shadow-lg"` 或自定义 `--shadow-simulator` |
| L63-67 | 背景点阵 | **保留** (视觉图案) |

### 4.2 Renderer 组件 (packages/editor/src/renderer/)

> ⚠️ Renderer 在独立 iframe 环境渲染，Mask/Overlay 组件使用动态定位计算，内联 style 是合理选择。仅对可复用值标准化。

#### `components/RendererSelectedMask.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L159 | `border: "1px dashed blue"` | **保留** (border) |
| L173 | `fontSize: "14px"` | 定义常量 `MASK_FONT_SIZE = "14px"` |
| L196,214,235,253 | `padding: "0 8px"` (×4) | 定义常量 `MASK_LABEL_PADDING = "0 8px"` |

#### `components/RendererHoverMask.tsx`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L88 | `border: "1px dashed blue"` | **保留** |
| L102 | `fontSize: "14px"` | 复用 `MASK_FONT_SIZE` |
| L110 | `padding: "0 8px"` | 复用 `MASK_LABEL_PADDING` |

#### `components/RendererEditArea.tsx`
| L59-63 | 背景点阵 | **保留** |

### 4.3 CSS 文件 (packages/editor/src/)

#### `index.css`
| 行号 | 原写法 | 替代方案 |
|------|--------|---------|
| L113-114 | `width: 6px; height: 6px` | 保留 (滚动条无令牌语义) |
| L213 | `margin-right: 6px` | `margin-right: var(--spacing-1)` (约=4px) 或保留 |
| L252,263,334,364,375 | `min-height: 60px` | 定义 `--editor-container-min-h: 60px` |
| L336 | `font-size: 16px` | `font-size: var(--text-lg)` |
| L366,377,383 | `font-size: 14px` | `font-size: var(--text-base)` |

#### `App.css`
| L32 | `translateY(10px)` | 保留 (动画偏移) |
| L43 | `translateX(-20px)` | 保留 (动画偏移) |

---

## 5. 实施计划

### Phase 1: 基础设施 (1h)

1. **扩展 `@theme`**：在 `index.css` 的 `@theme` 块中新增 `--spacing-*` 和 `--text-*` 变量
2. **定义 Renderer Mask 常量**：创建 `packages/editor/src/renderer/constants/styles.ts`，提取共享的 Mask 样式值

### Phase 2: Editor 组件迁移 (2-3h)

按文件逐一将 `style={{}}` 中的硬编码值替换为 Tailwind 类。优先级：
1. `AttrListSetter` (改动最多，约 15 处)
2. `StyleOptionGroup` + `LoadingPlaceholder`
3. `ComponentBreadcrumb` + `BreadcrumbSetter`

### Phase 3: CSS 文件令牌化 (30min)

将 `index.css` 中的 `font-size` 和 `min-height` 替换为 CSS 变量引用。

### Phase 4: Renderer 常量化 (30min)

将 `RendererSelectedMask` 和 `RendererHoverMask` 中重复的 `fontSize`、`padding` 提取为共享常量。

### Phase 5: 防劣化 (30min)

添加 ESLint 规则防止新增硬编码 px：

```js
// eslint.config.js 追加
{
  rules: {
    // 禁止 style={{}} 中使用带 "px" 的字符串字面量
    'no-restricted-syntax': ['warn', {
      selector: 'JSXAttribute[name.name="style"] Property > Literal[value=/\\d+px/]',
      message: '避免在 style={{}} 中硬编码 px 值，请使用 Tailwind 工具类或 CSS 变量。'
    }]
  }
}
```

---

## 6. 安全与性能

### 性能
- 将内联 `style={{}}` 迁移到 Tailwind 类可减少每次渲染的对象分配（尤其是 `AttrListSetter` 等列表组件）
- Tailwind v4 的 JIT 引擎只生成使用到的 CSS，不增加产物体积

### 安全
- 无安全影响，纯视觉层重构

### 风险
- Renderer iframe 中的组件不直接访问主窗口的 Tailwind 样式表，因此 Mask 组件**不能**使用 Tailwind 类
- 需确保 `@theme` 新增变量不与 Tailwind v4 内置变量冲突（已核实无冲突）

---

## 7. 决策记录

| 决策 | 理由 |
|------|------|
| 选择 Tailwind-first 而非纯 CSS 变量 | 项目已重度使用 Tailwind，保持一致性 |
| 不改 tokens.ts 职责 | 单一职责：tokens.ts 只服务 Ant Design |
| 不抽象 1px border | 行业标准写法，抽象增加认知负担 |
| 不抽象背景点阵 px | 视觉图案值无语义复用意义 |
| Renderer Mask 用 TS 常量而非 Tailwind | iframe 隔离环境限制 |
| 新增 ESLint 规则防劣化 | 架构治理需要机制保障，而非仅靠规范 |
