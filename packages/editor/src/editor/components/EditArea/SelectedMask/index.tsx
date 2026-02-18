/**
 * @file /src/editor/components/EditArea/SelectedMask/index.tsx
 * @description
 * 在编辑器画布中高亮“选中”组件的遮罩层。
 * 功能类似 HoverMask，但增加了：
 * - 显示组件层级关系（父组件面包屑）
 * - 提供删除 / 复制 / 粘贴等操作
 * 使用 React Portal 进行渲染。
 * @module Components/EditArea/SelectedMask
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getComponentById,
  useComponentsStore,
} from "../../../stores/components";
import { useUIStore } from "../../../stores/uiStore";
import { useHistoryStore } from "../../../stores/historyStore";
import type { Component, ComponentTree } from "@lowcode/schema";
import { Dropdown, message, Popconfirm, Space, Tooltip } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  FileAddOutlined,
} from "@ant-design/icons";

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
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
    labelFlipToRight: false, // 当标签会被左侧遮挡时，翻转到右侧
  });

  const { components, deleteComponent, pasteComponents } = useComponentsStore();
  const { curComponentId, setCurComponentId, setClipboard } = useUIStore();

  const [portalEl, setPortalEl] = useState<Element | null>(null);

  // 如果撤销或重做，可以及时更新 SelectedMask
  const { past, future } = useHistoryStore();

  useEffect(() => {
    const el = document.querySelector(`.${portalWrapperClassName}`);
    setPortalEl(el);
  }, [portalWrapperClassName]);

  /**
   * 将所有外部事件监听统一管理。
   * 无论是容器滚动还是窗口尺寸变化，都触发一次位置更新。
   */
  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    const handleScroll = () => {
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerClassName, componentId]);

  // 将定位逻辑放在 useLayoutEffect 中，确保在 DOM 更新之后、浏览器绘制之前执行
  // 注意：不依赖 components 对象，因为 props/desc 等非结构性变化不应触发位置更新
  // 只在 componentId 变化或撤销/重做时更新位置
  useLayoutEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, past, future]);

  /**
   * 计算并更新遮罩层的位置和大小
   */
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

    // 计算组件左边缘相对于容器的位置
    const componentLeft = left - containerLeft + container.scrollLeft;
    // 标签工具栏宽度约 180px，如果组件左边缘距离容器左边缘不足 180px，则标签会被遮挡
    const labelFlipToRight = componentLeft < 180;
    // 根据是否翻转，设置标签的左侧位置
    const labelLeft = labelFlipToRight
      ? componentLeft // 组件左边缘
      : componentLeft + width; // 组件右边缘

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

  // 当前选中组件
  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components],
  );

  // 通过 parentId 向上遍历，构建父组件面包屑
  const parentComponents = useMemo<Component[]>(() => {
    const parents: Component[] = [];
    let component = curComponent;
    while (component?.parentId != null) {
      const parent = getComponentById(component.parentId, components);
      if (!parent) break;
      parents.push(parent);
      component = parent;
    }
    return parents;
  }, [curComponent, components]);

  function handleCopy(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    if (!curComponentId) return;

    const tree = buildClipboardTree(curComponentId, components);
    if (!tree) return;

    setClipboard(tree);
    message.success("复制成功");
  }

  function handlePaste(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    if (curComponentId) {
      pasteComponents(curComponentId);
      message.success("粘贴成功");
    }
  }

  function handleDelete(e?: React.MouseEvent<HTMLElement>) {
    e?.stopPropagation();
    if (!curComponentId) return;
    deleteComponent(curComponentId);
    setCurComponentId(null);
  }

  if (!portalEl || !curComponent) return null;

  return createPortal(
    <>
      {/* 遮罩层 */}
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

      {/* 交互标签区域 */}
      <div
        style={{
          position: "absolute",
          left: position.labelLeft,
          top: position.labelTop,
          fontSize: "14px",
          zIndex: 13,
          display: !position.width || position.width < 10 ? "none" : "inline",
          // 正常：标签在组件右上角向左延伸；翻转后：标签在组件左上角向右延伸
          transform: position.labelFlipToRight
            ? "translate(0, -100%)" // 不水平偏移，只向上偏移
            : "translate(-100%, -100%)", // 向左上偏移
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
              {curComponent.desc}
            </div>
          </Dropdown>

          {/* 删除按钮（Page 组件不允许删除） */}
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
          <Tooltip title="复制">
            <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
              <CopyOutlined style={{ color: "#fff" }} onClick={handleCopy} />
            </div>
          </Tooltip>

          {/* 粘贴按钮 */}
          <Tooltip title="粘贴">
            <div style={{ padding: "0 8px", backgroundColor: "blue" }}>
              <FileAddOutlined
                style={{ color: "#fff" }}
                onClick={handlePaste}
              />
            </div>
          </Tooltip>
        </Space>
      </div>
    </>,
    portalEl,
  );
}

/**
 * 从范式化 Map 中构建以指定组件为根的树状结构，用于剪切板。
 */
function buildClipboardTree(
  id: number,
  components: Record<number, Component>,
): ComponentTree | null {
  const node = components[id];
  if (!node) return null;

  const children =
    node.children && node.children.length > 0
      ? (node.children
          .map((childId) => buildClipboardTree(childId, components))
          .filter(Boolean) as ComponentTree[])
      : undefined;

  return {
    id: node.id,
    name: node.name,
    props: node.props,
    desc: node.desc,
    parentId: node.parentId,
    children,
    styles: node.styles,
  };
}

export default SelectedMask;
