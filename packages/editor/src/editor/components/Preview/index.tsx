/**
 * @file /src/editor/components/Preview/index.tsx
 * @description
 * 预览模式 — 使用 SchemaRenderer(designMode="live") 统一渲染核心。
 * 事件编排通过 useEventOrchestrator Hook 注入。
 *
 * v3 架构变更：
 * - 渲染逻辑委托给 @lowcode/renderer 的 SchemaRenderer
 * - 事件编排提取到 useEventOrchestrator Hook
 * - 本组件仅负责从 store 取数据并传给 SchemaRenderer
 *
 * @security
 * - 自定义 JS (customJs) 使用 iframe 沙盒执行，参见 utils/sandboxExecutor.ts
 *
 * @module Components/Preview
 */

import React from "react";
import { ConfigProvider } from "antd";
import { SchemaRenderer } from "@lowcode/renderer";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponentsStore } from "../../stores/components";
import { useEventOrchestrator } from "../../hooks/useEventOrchestrator";

export function Preview() {
  const { components, rootId } = useComponentsStore();
  const { componentConfig } = useComponentConfigStore();

  const { handleEvent, handleCompRef } = useEventOrchestrator({
    components,
    componentConfig,
  });

  return (
    <ConfigProvider theme={{ inherit: false }}>
      <div>
        {rootId && (
          <SchemaRenderer
            components={components}
            rootId={rootId}
            componentMap={componentConfig}
            designMode="live"
            onEvent={handleEvent}
            onCompRef={handleCompRef}
          />
        )}
      </div>
    </ConfigProvider>
  );
}
