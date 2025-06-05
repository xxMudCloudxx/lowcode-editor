import type React from "react";
import type { CommonComponentProps } from "../../interface";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Modal as AntdModal } from "antd";

export interface ModalRef {
  open: () => void;
  close: () => void;
}

const ModalProd: React.ForwardRefRenderFunction<
  ModalRef,
  Omit<CommonComponentProps, "ref">
> = ({ children, title, onOk, onCancel, styles }, ref) => {
  const [open, setOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => {
      return {
        open: () => {
          setOpen(true);
        },
        close: () => {
          setOpen(false);
        },
      };
    },
    []
  );

  return (
    <AntdModal
      title={title}
      style={styles}
      open={open}
      onCancel={() => {
        onCancel && onCancel();
        setOpen(false);
      }}
      onOk={() => {
        onOk && onOk();
        setOpen(false);
      }}
      destroyOnHidden
    >
      {children}
    </AntdModal>
  );
};

export default forwardRef(ModalProd);
