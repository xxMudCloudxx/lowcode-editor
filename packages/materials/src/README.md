# 物料组件开发规范

本文档旨在说明本低代码编辑器中"物料组件"的设计模式与开发规范。所有位于 `src/editor/materials/` 目录下的组件都应遵循此规范。

---

## 🚀 架构升级说明 (v2 协议驱动架构)

### 为什么要重构？

**旧架构（dev/prod 分离）的痛点：**

1. **代码冗余**：每个组件需要维护 `dev.tsx` 和 `prod.tsx` 两个文件，逻辑重复
2. **逻辑耦合**：拖拽（react-dnd）逻辑散落在每个组件内部
3. **出码不一致**：出码器引用原生 Antd，但 `prod.tsx` 中的逻辑丢失

**新架构（协议驱动）的优势：**

1. **组件纯粹化**：物料组件只负责 UI 渲染，不感知编辑器
2. **能力外置**：拖拽、选中、悬浮等能力由画布统一注入
3. **单一来源**：只需维护一个 `index.tsx`，编辑器和预览共用

### 架构对比

```
旧架构 (dev/prod 分离)              新架构 (协议驱动)
========================            ========================
materials/Button/                   materials/Button/
├── dev.tsx      ❌ 耦合 DnD        ├── index.tsx   ✅ 纯净组件
├── prod.tsx     ❌ 重复逻辑        └── meta.tsx    ✅ 协议配置
└── meta.tsx
```

---

## 📝 新增物料组件指南 (新架构)

### 文件结构

```
materials/
└── YourComponent/
    ├── index.tsx    # 纯净 UI 组件（必须使用 forwardRef）
    └── meta.tsx     # 组件协议配置
```

### 第一步：创建纯净组件 `index.tsx`

> ⚠️ **关键要求**：必须使用 `forwardRef` 包裹，否则拖拽功能失效！

```tsx
/**
 * @file YourComponent/index.tsx
 * @description 纯净的 YourComponent 物料组件
 */
import { forwardRef } from "react";
import { YourAntdComponent } from "antd";
import type { YourAntdComponentProps } from "antd";

export interface YourComponentProps extends YourAntdComponentProps {
  // 自定义属性...
}

const YourComponent = forwardRef<HTMLElement, YourComponentProps>(
  (props, ref) => {
    return <YourAntdComponent ref={ref} {...props} />;
  }
);

YourComponent.displayName = "YourComponent";

export default YourComponent;
```

**Button 示例：**

```tsx
import {
  Button as AntdButton,
  type ButtonProps as AntdButtonProps,
} from "antd";
import { forwardRef, type ReactNode } from "react";

export interface ButtonProps extends AntdButtonProps {
  text?: ReactNode; // 便捷属性
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ text, children, ...props }, ref) => {
    return (
      <AntdButton ref={ref} {...props}>
        {text ?? children}
      </AntdButton>
    );
  }
);

Button.displayName = "Button";
export default Button;
```

### 第二步：配置组件协议 `meta.tsx`

```tsx
import { lazy } from "react";
import type { ComponentProtocol } from "../../../types/component-protocol";
import { PT_GENERAL } from "../../containerTypes";

const YourComponentProtocol: ComponentProtocol = {
  // ===== 身份层 =====
  name: "YourComponent", // 唯一标识，必须与文件夹名一致
  desc: "你的组件", // 显示在物料面板的名称
  category: "通用", // 分类：通用/布局/数据录入/数据展示/导航/反馈

  // ===== 渲染层 =====
  component: lazy(() => import("./index")), // 懒加载组件
  defaultProps: {
    // 初始属性
  },

  // ===== 编辑层 =====
  editor: {
    isContainer: false, // 是否为容器（可接收子组件）
    parentTypes: PT_GENERAL, // 允许放置的父容器类型
    interactiveInEditor: false, // 编辑器内是否允许原生交互
    display: "inline-block", // 显示模式：inline / block / inline-block
  },

  // 属性设置器（右侧"属性"面板）
  setter: [
    { name: "propName", label: "属性标签", type: "input" },
    { name: "selectProp", label: "选择", type: "select", options: ["a", "b"] },
    { name: "boolProp", label: "开关", type: "switch" },
  ],

  // 事件配置（右侧"事件"面板）
  events: [{ name: "onClick", label: "点击事件" }],
};

export default YourComponentProtocol;
```

### 第三步：验证

1. 重启开发服务器 `pnpm dev`
2. 在物料面板找到你的组件
3. 拖拽到画布，验证：
   - ✅ 可正常拖入
   - ✅ 点击可选中
   - ✅ 悬浮有高亮
   - ✅ 属性面板可配置

---

## 📋 `editor` 配置详解

| 属性                  | 类型          | 默认值   | 说明                                   |
| --------------------- | ------------- | -------- | -------------------------------------- |
| `isContainer`         | boolean       | false    | 是否为容器组件，容器可接收子组件拖放   |
| `parentTypes`         | string[]      | -        | 允许作为父组件的类型列表，用于拖放校验 |
| `interactiveInEditor` | boolean       | false    | 编辑器内是否允许原生交互               |
| `display`             | string        | "inline" | 组件显示模式                           |
| `dragPreview`         | ComponentType | -        | 自定义拖拽预览组件                     |

### `interactiveInEditor` 使用场景

```tsx
// Button: 编辑时点击不应触发按钮，只选中
interactiveInEditor: false;

// Tabs: 编辑时需要点击切换标签查看不同面板
interactiveInEditor: true;

// Collapse: 编辑时需要展开/收起面板
interactiveInEditor: true;
```

### `parentTypes` 预设常量

在 `containerTypes.ts` 中定义了常用的父容器类型组合：

```typescript
import { PT_GENERAL, PT_LAYOUT, PT_DATA } from "../../containerTypes";

// PT_GENERAL - 通用原子组件（Button, Icon 等）可放置的位置
// PT_LAYOUT  - 布局组件（Grid, Container 等）可放置的位置
// PT_DATA    - 数据组件（Form, Table 等）可放置的位置
```

---

## 🔄 迁移旧组件指南

如果你需要将现有的 `dev/prod` 组件迁移到新架构：

### 步骤 1：创建 `index.tsx`

将 `prod.tsx` 的核心逻辑提取出来，添加 `forwardRef`：

```tsx
// 旧 prod.tsx
const ButtonProd = ({ type, text, styles, ...props }) => {
  return (
    <AntdButton type={type} style={styles} {...props}>
      {text}
    </AntdButton>
  );
};

// 新 index.tsx
const Button = forwardRef(({ type, text, style, ...props }, ref) => {
  return (
    <AntdButton ref={ref} type={type} style={style} {...props}>
      {text}
    </AntdButton>
  );
});
```

### 步骤 2：重写 `meta.tsx`

将旧的 meta 配置转换为新协议格式：

```tsx
// 旧格式
export default {
  name: "Button",
  parentTypes: ["Page", "Container"],
  // ...
} as Omit<ComponentConfig, "dev" | "prod">;

// 新格式
const ButtonProtocol: ComponentProtocol = {
  name: "Button",
  component: lazy(() => import("./index")),
  editor: {
    parentTypes: ["Page", "Container"],
    // ...
  },
  // ...
};
export default ButtonProtocol;
```

### 步骤 3：删除旧文件

```bash
rm dev.tsx prod.tsx
```

### 步骤 4：验证

确保组件在编辑器中正常工作。

---

## ⚠️ 常见问题

### Q: 拖拽不生效

**原因**：组件没有使用 `forwardRef`，导致 ref 注入失败。

**解决**：确保组件使用 `forwardRef` 包裹，并将 ref 转发到根 DOM 节点。

### Q: 控制台报 ref 警告

```
Warning: Function components cannot be given refs.
```

**原因**：同上，组件未使用 `forwardRef`。

### Q: 点击组件无法选中

**原因**：组件内部可能阻止了事件冒泡（`e.stopPropagation()`）。

**解决**：新架构使用事件捕获阶段处理，此问题已被解决。

### Q: 布局错乱

**原因**：旧架构使用 wrapper div 包裹会破坏 Flex/Grid 布局。

**解决**：新架构使用 `cloneElement` 注入，零额外 DOM，不会破坏布局。

---

## 🏗️ 旧架构文档（兼容期保留）

> 以下内容适用于尚未迁移的旧组件，新组件请使用上述新架构。

### 核心设计理念：`dev` 与 `prod` 分离

为了将**编辑器环境的交互逻辑**与**最终线上运行的纯净业务逻辑**解耦，旧架构为每个物料组件设计了两个版本：

1. **`dev.tsx` (开发版本)**：
   - 用于在编辑器画布中渲染
   - 负责拖拽 (`useDrag`)、放置 (`useDrop`) 等交互
   - 必须附加 `data-component-id={id}` 属性

2. **`prod.tsx` (生产版本)**：
   - 用于预览模式和导出代码
   - 纯净的 React 业务组件

### 旧架构文件结构

```
materials/
└── OldComponent/
    ├── dev.tsx      # 开发版本
    ├── prod.tsx     # 生产版本
    └── meta.tsx     # 元数据配置
```

---

## 📚 相关文件

- `types/component-protocol.ts` - 协议接口定义
- `hooks/useMergeRefs.ts` - Ref 合并工具
- `components/EditArea/DraggableNode.tsx` - 拖拽能力注入
- `containerTypes.ts` - 父容器类型预设
