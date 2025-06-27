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
import { Dropdown, message, Popconfirm, Space, Tooltip } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  FileAddOutlined,
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
    copyComponents,
    pasteComponents,
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

  /**
   * @description 将所有外部事件监听统一管理。
   * 无论是容器滚动还是尺寸变化，我们都只做一件事：触发更新。
   * 这样做不仅逻辑清晰，而且性能更可控。
   */
  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    // 创建一个可复用的强制更新函数
    const forceUpdate = () => setUpdateTrigger((v) => v + 1);

    // 对滚动事件进行节流（throttle），防止过于频繁地触发更新，提升性能
    // requestAnimationFrame 是浏览器原生支持的，非常适合做此类UI更新的节流
    let scrollTimeOut: number;

    // 定义滚动事件的处理函数
    const handleScroll = () => {
      // 取消上一个动画帧请求
      // 如果在前一个 16ms 内已经有了一个更新请求，但它还没来得及执行，
      // 那么就取消它。我们只关心最新的状态。
      cancelAnimationFrame(scrollTimeOut);
      //注册一个新的动画帧请求;
      // 告诉浏览器：“请在下一次屏幕可以重绘的时候，帮我调用 forceUpdate”。
      // 这就保证了在 16.7ms 的时间窗口内，forceUpdate 最多只会被调用一次。
      scrollTimeOut = requestAnimationFrame(forceUpdate);
    };

    const resizeObserver = new ResizeObserver(forceUpdate);
    // 使用 passive: true 优化滚动性能，确保滚动动画的流畅性。
    container.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(scrollTimeOut);
    };
  }, [containerClassName]);

  // 将所有定位逻辑统一到 useLayoutEffect 中。
  // 它保证了DOM测量（getBoundingClientRect）发生在DOM更新之后、浏览器绘制之前，
  // 从而读取到最准确的布局信息，彻底解决了因“赛跑问题”导致的定位偏移。
  useLayoutEffect(() => {
    // 把 updatePosition 的逻辑放在 effect 内部，确保它能访问到最新的所有依赖
    if (!componentId) return;

    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const node = document.querySelector(`[data-component-id="${componentId}"]`);
    // 当组件被删除时，node 可能不存在，此时应隐藏遮罩
    if (!node) {
      setPosition((pos) => ({ ...pos, width: 0, height: 0 }));
      return;
    }

    const { top, left, width, height } = node.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } =
      container.getBoundingClientRect();

    let labelTop = top - containerTop + container.scrollTop;
    let labelLeft = left - containerLeft + width;

    if (labelTop <= 0) {
      labelTop += 20;
    }

    if (labelLeft <= 100) {
      labelLeft += labelLeft;
    }

    setPosition({
      top: top - containerTop + container.scrollTop,
      left: left - containerLeft + container.scrollLeft, // 确保 scrollLeft 的修正是保留的
      width,
      height,
      labelTop,
      labelLeft,
    });

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

  const curComponent = useMemo(() => {
    return getComponentById(componentId, components);
  }, [componentId]);

  function handleCopy(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    if (curComponentId) {
      copyComponents(curComponentId);
      message.success("已复制");
    }
  }

  const ContainerList: Set<string> = new Set([
    "Container",
    "Page",
    "Modal",
    "Table",
  ]);

  function handlePaste(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    // 智能判断粘贴目标：
    // 如果当前选中是容器，就粘贴到容器内部
    // 否则，粘贴到当前组件的父级中（成为其兄弟节点）
    if (!curComponent) return;
    const parentId = ContainerList.has(curComponent.name)
      ? curComponent.id
      : curComponent.parentId;

    if (parentId) {
      pasteComponents(parentId);
    }

    message.success("粘贴成功");
  }

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
            <Tooltip title="删除">
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
            </Tooltip>
          )}
          {/* 复制按钮 */}
          {
            <Tooltip title="复制">
              <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
                <CopyOutlined style={{ color: "#fff" }} onClick={handleCopy} />
              </div>
            </Tooltip>
          }
          {/* 粘贴按钮  */}
          {
            <Tooltip title="粘贴">
              <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
                {/* <Popconfirm
                  title="确认粘贴？"
                  okText={"确认"}
                  cancelText={"取消"}
                  onConfirm={handlePaste}
                >
                </Popconfirm> */}
                <FileAddOutlined
                  style={{ color: "#fff" }}
                  onClick={handlePaste}
                />
              </div>
            </Tooltip>
          }
        </Space>
      </div>
    </>,
    portalEl
  );
}

export default SelectedMask;
