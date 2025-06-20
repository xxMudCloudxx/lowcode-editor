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
import {
  BgColorsOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useStore } from "zustand";

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

  const {
    components,
    curComponentId,
    deleteComponent,
    setCurComponentId,
    copy,
    paste,
  } = useComponetsStore();

  const [portalEl, setPortalEl] = useState<Element | null>(null);

  // 一个专门用于强制更新的触发器。
  // 当我们需要在DOM布局变化后重新计算遮罩层位置时（如窗口缩放），
  // 就通过更新这个 state 来触发 useLayoutEffect 的重新执行。
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // 如果撤销或重做，可以及时更新SelectedMask
  const { pastStates, futureStates } = useStore(useComponetsStore.temporal);

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

  // 使用 ResizeObserver 来精确、可靠地监听容器尺寸变化。
  // 它比 window.resize 事件更健壮，能避免因事件时机问题导致的定位不准。
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

  // 将所有定位逻辑统一到 useLayoutEffect 中。
  // 它保证了DOM测量（getBoundingClientRect）发生在DOM更新之后、浏览器绘制之前，
  // 从而读取到最准确的布局信息，彻底解决了因“赛跑问题”导致的定位偏移。
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
  }, [
    componentId,
    components,
    updateTrigger,
    containerClassName,
    pastStates,
    futureStates,
  ]);

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

  function handleDelete(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
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
          {
            <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
              <CopyOutlined
                style={{ color: "#fff" }}
                onClick={() => copy(curComponentId!)}
              />
            </div>
          }
          {
            <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
              <Popconfirm
                title="确认粘贴？"
                okText={"确认"}
                cancelText={"取消"}
                onConfirm={() => paste(curComponentId!)}
              >
                <BgColorsOutlined style={{ color: "#fff" }} />
              </Popconfirm>
            </div>
          }
        </Space>
      </div>
    </>,
    portalEl
  );
}

export default SelectedMask;
