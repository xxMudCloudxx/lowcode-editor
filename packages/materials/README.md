# 物料组件库 (Materials)

本包 (`@lowcode/materials`) 存放了低代码编辑器中所有可用的物料组件。它不仅仅是一个 UI 组件库，更包含了一套完整的自动化注册和元数据生成体系。

## 📂 目录结构

每个物料组件都作为一个独立的目录存在，包含以下三个核心文件：

```
packages/materials/src/
├── Button/
│   ├── dev.tsx      # 编辑器内使用的组件版本（通常带有占位符或特定交互逻辑）
│   ├── prod.tsx     # 预览/生产环境使用的组件版本（真实的业务组件）
│   └── meta.tsx     # 组件的元数据定义（属性、样式、拖拽规则等）
├── _generated/      # [自动生成] 由 scripts/gen-antd-metas.ts 生成的元数据
└── index.tsx        # 物料注册入口，负责汇总所有物料
```

## 🚀 开发新物料

### 1. 创建组件目录

在 `src/` 下根据分类（如 `General`, `Layout`）创建组件文件夹。

### 2. 编写 `prod.tsx`

这是组件在最终页面上渲染的样子。通常是对 Ant Design 组件的简单封装。

```tsx
import { Button as AntdButton } from "antd";
import { CommonComponentProps } from "@lowcode/schema";

const Button = ({ children, ...props }: CommonComponentProps) => {
  return <AntdButton {...props}>{children}</AntdButton>;
};

export default Button;
```

### 3. 编写 `dev.tsx`

这是组件在编辑器画布中的样子。为了更好的编辑体验，你可能需要禁用某些交互（如链接跳转），或者添加占位符。

```tsx
// 通常直接复用 prod.tsx，除非有特殊需求
import Button from "./prod";
export default Button;
```

### 4. 编写 `meta.tsx`

这是组件的“身份证”，定义了它在编辑器中如何展示和配置。

```tsx
import { ComponentProtocol } from "@lowcode/schema";

const meta: ComponentProtocol = {
  name: "Button",
  desc: "按钮",
  categoryId: "通用",
  props: [
    {
      name: "type",
      label: "类型",
      setter: {
        componentName: "Select",
        props: {
          options: [
            { label: "主按钮", value: "primary" },
            { label: "次按钮", value: "default" },
          ],
        },
      },
    },
  ],
  // ...更多配置
};

export default meta;
```

## 🤖 自动化元数据生成

对于 Ant Design 这种属性繁多的组件库，手动编写 `meta.tsx` 非常耗时。我们提供了一个自动化脚本来辅助开发。

### 运行脚本

```bash
pnpm --filter @lowcode/materials gen:meta
```

该脚本会扫描 `src/` 目录下的组件，利用 `react-docgen-typescript` 分析其 Props 定义，并自动在 `src/_generated/` 目录下生成对应的 `meta.tsx` 文件。

### 混合策略

系统采用“手写优先，自动补全”的策略：

1. 如果你手写了 `meta.tsx`，系统会优先使用你的配置。
2. 自动生成的配置（如 props 列表）会合并进来，补全你没写的属性。

## 📦 导出

所有组件最终通过 `src/index.tsx` 统一导出。该文件利用了 Vite 的 `import.meta.glob` 特性，自动发现新添加的组件，**无需手动修改 index.tsx 即可注册新物料**。
