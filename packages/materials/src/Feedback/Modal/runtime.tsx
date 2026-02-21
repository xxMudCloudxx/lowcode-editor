/**
 * @file Modal/runtime.tsx
 * @description Modal 组件的运行时版本
 *
 * 在预览/生产环境中渲染为真正的 Antd Modal
 *
 * 支持两种控制模式：
 * 1. 受控模式（Props驱动）: 通过 open 属性控制，适合响应式数据绑定
 * 2. 非受控模式（Method驱动）: 通过 ref.open()/close() 控制，适合命令式调用
 */
import { forwardRef, useState, useEffect, useImperativeHandle } from "react";
import { Modal as AntdModal, type ModalProps as AntdModalProps } from "antd";
import type { MaterialProps } from "../../interface";

export interface ModalRuntimeProps
  extends MaterialProps,
    Omit<AntdModalProps, keyof MaterialProps | "open" | "onOk" | "onCancel"> {
  /** 弹窗标题 */
  title?: string;
  /**
   * 控制弹窗显隐（受控模式）
   * 可绑定表达式如 {{ state.showModal }}
   */
  open?: boolean;
  /** 确认回调 */
  onOk?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
}

export interface ModalRef {
  open: () => void;
  close: () => void;
}

const ModalRuntime = forwardRef<ModalRef, ModalRuntimeProps>(
  (
    {
      children,
      title = "弹窗",
      open: propOpen, // Props 传入的 open（受控模式）
      onOk,
      onCancel,
      ...restProps
    },
    ref
  ) => {
    // 内部状态
    const [internalOpen, setInternalOpen] = useState(false);

    // 同步 Props 到内部状态（受控模式支持）
    // 当 propOpen 变化时（如用户绑定了 {{ state.showModal }}），同步到内部状态
    useEffect(() => {
      if (propOpen !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInternalOpen(propOpen);
      }
    }, [propOpen]);

    // 暴露 open/close 方法（非受控模式支持）
    useImperativeHandle(
      ref,
      () => ({
        open: () => setInternalOpen(true),
        close: () => setInternalOpen(false),
      }),
      []
    );

    const handleOk = () => {
      onOk?.();
      // 如果是非受控模式，自动关闭
      if (propOpen === undefined) {
        setInternalOpen(false);
      }
    };

    const handleCancel = () => {
      onCancel?.();
      // 如果是非受控模式，自动关闭
      if (propOpen === undefined) {
        setInternalOpen(false);
      }
    };

    return (
      <AntdModal
        title={title}
        open={internalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        {...restProps}
      >
        {children}
      </AntdModal>
    );
  }
);

ModalRuntime.displayName = "ModalRuntime";

export default ModalRuntime;
