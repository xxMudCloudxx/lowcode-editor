/**
 * @file /src/editor/components/EditArea/SelectedMask/index.tsx
 * @description
 * 一个用于在编辑器画布中高亮“选中”组件的遮罩层。
 * 功能与 HoverMask 类似，但增加了额外的交互功能：
 * - 显示组件层级关系（父组件面包屑）。
 * - 提供删除组件的操作。
 * 同样使用 React Portal 进行渲染。
 * @module Components/EditArea/SelectedMask
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getComponentById,
  useComponetsStore,
} from "../../../stores/components";
import { Dropdown, Popconfirm, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

interface SelectedMaskProps {
  portalWrapperClassName: string;
  containerClassName: string;
  componentId: number;
}

function SelectedMask({
  containerClassName,
  portalWrapperClassName,
  componentId,
}: SelectedMaskProps) {
  // ... (position state 和 updatePosition 函数与 HoverMask 完全相同)
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
  });

  const { components, curComponentId, deleteComponent, setCurComponentId } =
    useComponetsStore();

  const [portalEl, setPortalEl] = useState<Element | null>(null);

  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  useEffect(() => {
    updatePosition();
  }, [componentId]);

  useEffect(() => {
    // FIXME: 使用 setTimeout(20) 来等待 DOM 更新可能不稳定，
    // 在某些情况下可能导致定位不准。
    // 考虑使用 useLayoutEffect 或 ResizeObserver 来更可靠地在 DOM 变更后更新位置。
    setTimeout(() => {
      updatePosition();
    }, 20);
  }, [components]);

  // 监听窗口大小变化，以重新计算位置
  // ResizeObserver 现在只负责“触发更新”，不再直接调用 updatePosition
  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // 当容器尺寸变化，我们只更新触发器 state
      setUpdateTrigger((v) => v + 1);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerClassName]);

  // 将所有更新逻辑统一到 useLayoutEffect 中
  useLayoutEffect(() => {
    // 把 updatePosition 的逻辑放在 effect 内部，确保它能访问到最新的所有依赖
    const updatePosition = () => {
      if (!componentId) return;

      const container = document.querySelector(`.${containerClassName}`);
      if (!container) return;

      const node = document.querySelector(
        `[data-component-id="${componentId}"]`
      );
      if (!node) return;

      const { top, left, width, height } = node.getBoundingClientRect();
      const { top: containerTop, left: containerLeft } =
        container.getBoundingClientRect();

      let labelTop = top - containerTop + container.scrollTop;
      let labelLeft = left - containerLeft + width;

      if (labelTop <= 0) {
        labelTop -= -20;
      }

      setPosition({
        top: top - containerTop + container.scrollTop,
        left: left - containerLeft + container.scrollLeft, // 确保 scrollLeft 的修正是保留的
        width,
        height,
        labelTop,
        labelLeft,
      });
    };

    updatePosition();

    // 依赖项现在包含了组件ID、组件树、以及我们的resize触发器
    // 任何一个发生变化，都会在最正确的时机重新计算位置
  }, [componentId, components, updateTrigger, containerClassName]);

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
    let labelLeft = left - containerLeft + width;

    if (labelTop <= 0) {
      labelTop -= -20;
    }

    setPosition({
      top: top - containerTop + container.scrollTop,
      left: left - containerLeft + container.scrollLeft,
      width,
      height,
      labelTop,
      labelLeft,
    });
  }

  const curComponent = useMemo(() => {
    return getComponentById(componentId, components);
  }, [componentId]);

  function handleDelete() {
    deleteComponent(curComponentId!);
    setCurComponentId(null);
  }

  const parentComponents = useMemo(() => {
    const parentComponents = [];
    let component = curComponent;
    while (component?.parentId) {
      component = getComponentById(component.parentId, components)!;
      parentComponents.push(component);
    }
    return parentComponents;
  }, [curComponent]);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* 遮罩层 */}
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          backgroundColor: "rgba(0, 0, 255, 0.1)",
          border: "1px dashed blue",
          pointerEvents: "none",
          width: position.width,
          height: position.height,
          zIndex: 12,
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      />

      {/* 交互标签区域 */}
      <div
        style={{
          position: "absolute",
          left: position.labelLeft,
          top: position.labelTop,
          fontSize: "14px",
          zIndex: 13,
          display: !position.width || position.width < 10 ? "none" : "inline",
          transform: "translate(-100%, -100%)",
        }}
      >
        <Space>
          {/* 父组件层级面包屑 */}
          <Dropdown
            menu={{
              items: parentComponents.map((item) => ({
                key: item.id,
                label: item.desc,
              })),
              onClick: ({ key }) => {
                // 允许用户通过面包屑快速选中父组件
                setCurComponentId(+key);
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
              }}
            >
              {curComponent?.desc}
            </div>
          </Dropdown>
          {/* 删除按钮 (根 Page 组件不允许删除) */}
          {curComponentId !== 1 && (
            <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
              <Popconfirm
                title="确认删除？"
                okText={"确认"}
                cancelText={"取消"}
                onConfirm={handleDelete}
              >
                <DeleteOutlined style={{ color: "#fff" }} />
              </Popconfirm>
            </div>
          )}
        </Space>
      </div>
    </>,
    portalEl
  );
}

export default SelectedMask;
