/**
 * @file Modal/index.tsx
 * @description Modal 组件的编辑器版本（容器组件）
 *
 * 在编辑器中作为平铺容器，用户可以往里面拖拽子组件。
 * visibleInEditor 控制是否在画布中可见。
 */
import React, { forwardRef } from "react";
import type { MaterialProps } from "../../interface";

export interface ModalProps extends MaterialProps {
  /** 弹窗标题 */
  title?: string;
  /** 是否在编辑器中可见 */
  visibleInEditor?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      style,
      className,
      children,
      title = "弹窗",
      visibleInEditor = true,
      "data-component-id": id,
      ...restProps
    },
    ref
  ) => {
    // 核心逻辑：当 visibleInEditor 为 false 时，不渲染内容
    // 但仍然需要渲染一个带 data-component-id 的元素，以便大纲树能选中它
    if (!visibleInEditor) {
      return (
        <div
          ref={ref}
          data-component-id={id}
          style={{
            display: "none",
            ...style,
          }}
          className={className}
          {...restProps}
        />
      );
    }

    // 检查是否有子组件
    const hasChildren = React.Children.count(children) > 0;

    // 编辑器模式下渲染为占位符容器
    return (
      <div
        ref={ref}
        data-component-id={id}
        style={{
          minHeight: 100,
          padding: 20,
          border: "1px solid #d9d9d9",
          borderRadius: 8,
          backgroundColor: "#fff",
          ...style,
        }}
        className={className}
        {...restProps}
      >
        <h4 style={{ margin: "0 0 12px 0", fontWeight: 500 }}>{title}</h4>
        <div>
          {hasChildren ? (
            children
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 60,
                backgroundColor: "#fafafa",
                color: "#999",
                borderRadius: 4,
              }}
            >
              拖拽组件到弹窗内
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = "Modal";

export default Modal;
