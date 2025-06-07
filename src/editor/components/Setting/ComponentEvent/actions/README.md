# 事件动作配置组件开发规范

本文档旨在说明 `actions` 目录下的“动作配置组件”的设计模式和开发规范。所有新创建的动作配置组件都应遵循此文档。

## 核心设计理念：受控表单片段

本目录下的每一个 `.tsx` 文件都是一个独立的 React 组件，其核心职责是为一种特定的“事件动作”提供配置界面。

所有这些组件都共同遵循一种**“受控组件”**的设计模式。它们从父组件（`ActionModal`）接收数据，并将用户的修改通过回调函数通知父组件。

## 组件 Props “契约”

每个动作配置组件都应遵循以下 Props 约定：

### `value` Prop (或 `defaultValue`)

- **作用**: 父组件通过此 prop 将当前动作的配置数据传入。组件应使用这个 `value` 来填充其内部表单元素的初始状态。
- **注意**: 在现有代码中，部分组件可能同时使用了 `value` 和 `defaultValue`。规范上，应优先依赖 `value` 来同步状态。

### `onChange` Prop

- **类型**: `(config: ActionConfig) => void`
- **作用**: 这是实现“受控”的关键。当组件内部的表单值发生变化时，**必须**调用 `onChange` 函数。
- **数据格式**: 调用 `onChange` 时，传递的参数**必须是完整的、符合该动作类型定义的配置对象**。
  - 例如，在 `GoToLink.tsx` 中，当输入框的值变为 `"https://example.com"` 时，它会调用 `onChange({ type: 'goToLink', url: 'https://example.com' })`。

## 文件导出规范

每个动作配置文件都必须导出两项内容：

1.  **该动作的 TypeScript 类型定义**（`interface` 或 `type`），其命名应为 `[ActionName]Config`。
2.  **实现配置 UI 的 React 组件**。

**示例 (`GoToLink.tsx`)**:

```typescript
// 1. 导出类型定义
export interface GoToLinkConfig {
  type: "goToLink";
  url: string;
}

// 2. 导出组件
export function GoToLink(props: GoToLinkProps) {
  /* ... */
}
```

---

## 如何新增一个动作 (严格遵循现有项目逻辑)

假设要新增一个名为 `SendAnalytics` 的动作。

**第一步：创建动作组件**

1.  在 `actions/` 目录下创建新文件 `SendAnalytics.tsx`。
2.  在该文件中，定义并导出 `SendAnalyticsConfig` 类型和 `SendAnalytics` 组件。确保组件遵循上述的 `value` 和 `onChange` Props 契约。

**第二步：在 `ActionModal` 中注册**

打开 `src/editor/components/Setting/ComponentEvent/ActionModal/index.tsx` 文件。

1.  **导入**:
    ```typescript
    import {
      SendAnalytics,
      type SendAnalyticsConfig,
    } from "../actions/SendAnalytics";
    ```
2.  **更新联合类型**: 将 `SendAnalyticsConfig` 添加到 `ActionConfig` 联合类型中：
    ```typescript
    export type ActionConfig =
      | GoToLinkConfig
      | ShowMessageConfig
      | CustomJsConfig
      | ComponentMethodConfig
      | SendAnalyticsConfig; // <-- 添加在这里
    ```
3.  **更新 `map` 对象**: 在 `map` 对象中添加新动作的显示名称：
    ```typescript
    const map = {
      // ... 其他类型
      sendAnalytics: "发送分析数据", // <-- 添加新类型的映射
    };
    ```
4.  **更新 `Segmented` 控件**: 在 `options` 数组中添加新的选项：
    ```javascript
    options={["访问链接", "消息提示", "自定义 JS", "组件方法", "发送分析数据"]} // <-- 添加新选项
    ```
5.  **更新渲染逻辑**: 在 `ActionModal` 组件返回的 JSX 中，找到 `key === '...'` 的条件渲染部分，为新动作添加一个渲染分支：
    ```tsx
    {
      key === "发送分析数据" && (
        <SendAnalytics
          key="sendAnalytics"
          value={action?.type === "sendAnalytics" ? action : undefined}
          onChange={(config) => {
            setCurConfig(config);
          }}
        />
      );
    }
    ```

\*\*第三步：在 `ComponentEvent` 面板中更新显示
