/**
 * @file renderer/components/RendererSelectedMask.tsx
 * @description
 * Iframe 内的 SelectedMask。
 * 与原版的核心差异：
 * - 数据源从 useComponentsStore 改为 useRendererStore
 * - 删除/复制/粘贴等操作通过 SimulatorRenderer.dispatchAction 委托给 Host
 * - 选中状态变更通过 SimulatorRenderer.selectComponent 通知 Host
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRendererStore } from "../stores/rendererStore";
import { simulatorRenderer } from "../../editor/simulator/SimulatorRenderer";
import { Dropdown, Popconfirm, Space, Tooltip } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { Component } from "@lowcode/schema";

interface RendererSelectedMaskProps {
  portalWrapperClassName: string;
  containerClassName: string;
  componentId: number;
}

export function RendererSelectedMask({
  containerClassName,
  portalWrapperClassName,
  componentId,
}: RendererSelectedMaskProps) {
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
    labelFlipToRight: false,
  });

  const { components, curComponentId } = useRendererStore();
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerClassName, componentId]);

  useLayoutEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, components]);

  function updatePosition() {
    if (!componentId) return;

    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const node = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!node) return;

    const { top, left, width, height } = node.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } =
      container.getBoundingClientRect();

    let labelTop = top - containerTop + container.scrollTop;
    if (labelTop <= 0) {
      labelTop += 20;
    }

    const componentLeft = left - containerLeft + container.scrollLeft;
    const labelFlipToRight = componentLeft < 180;
    const labelLeft = labelFlipToRight ? componentLeft : componentLeft + width;

    setPosition({
      top: top - containerTop + container.scrollTop,
      left: componentLeft,
      width,
      height,
      labelLeft,
      labelTop,
      labelFlipToRight,
    });
  }

  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null ? (components[curComponentId] ?? null) : null,
    [curComponentId, components],
  );

  // 构建父组件面包屑
  const parentComponents = useMemo<Component[]>(() => {
    const parents: Component[] = [];
    let component = curComponent;
    while (component?.parentId != null) {
      const parent = components[component.parentId];
      if (!parent) break;
      parents.push(parent);
      component = parent;
    }
    return parents;
  }, [curComponent, components]);

  function handleDelete(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    if (!curComponentId) return;
    simulatorRenderer.dispatchAction("deleteComponent", curComponentId);
    simulatorRenderer.selectComponent(null);
  }

  function handleCopy(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    // 复制操作需要在 Host 侧执行（涉及剪切板）
    // 简化方案：通知 Host 执行复制
    if (!curComponentId) return;
    // 通过自定义 action 委托给 Host
    simulatorRenderer.dispatchAction("__copyToClipboard", curComponentId);
  }

  function handlePaste(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    if (curComponentId) {
      simulatorRenderer.dispatchAction("pasteComponents", curComponentId);
    }
  }

  if (!portalEl || !curComponent) return null;

  return createPortal(
    <>
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          backgroundColor: "rgba(0, 0, 255, 0.05)",
          border: "1px dashed blue",
          pointerEvents: "none",
          width: position.width,
          height: position.height,
          zIndex: 12,
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: position.labelLeft,
          top: position.labelTop,
          fontSize: "14px",
          zIndex: 13,
          display: !position.width || position.width < 10 ? "none" : "flex",
          transform: position.labelFlipToRight
            ? "translate(0, -100%)"
            : "translate(-100%, -100%)",
        }}
      >
        <Space>
          <Dropdown
            menu={{
              items: parentComponents.map((item) => ({
                key: item.id,
                label: item.desc,
              })),
              onClick: ({ key }) => {
                simulatorRenderer.selectComponent(+key);
              },
            }}
            disabled={parentComponents.length === 0}
          >
            <div
              style={{
                padding: "0 8px",
                backgroundColor: "blue",
                borderRadius: 4,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                height: 24,
              }}
            >
              {curComponent.desc}
            </div>
          </Dropdown>

          {componentId !== 1 && (
            <div
              style={{
                padding: "0 8px",
                backgroundColor: "blue",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                height: 24,
              }}
            >
              <Popconfirm
                title="确认删除？"
                onConfirm={handleDelete}
                okText="确认"
                cancelText="取消"
              >
                <DeleteOutlined style={{ color: "#fff", cursor: "pointer" }} />
              </Popconfirm>
            </div>
          )}

          <div
            style={{
              padding: "0 8px",
              backgroundColor: "blue",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              height: 24,
            }}
          >
            <Tooltip title="复制">
              <CopyOutlined
                style={{ color: "#fff", cursor: "pointer" }}
                onClick={handleCopy}
              />
            </Tooltip>
          </div>

          <div
            style={{
              padding: "0 8px",
              backgroundColor: "blue",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              height: 24,
            }}
          >
            <Tooltip title="粘贴">
              <FileAddOutlined
                style={{ color: "#fff", cursor: "pointer" }}
                onClick={handlePaste}
              />
            </Tooltip>
          </div>
        </Space>
      </div>
    </>,
    portalEl,
  );
}
