/**
 * @file TableColumn/index.tsx
 * @description 纯净的 TableColumn 组件
 */
import { forwardRef } from "react";
import type { MaterialProps } from "../../interface";

export interface TableColumnProps extends MaterialProps {
  title?: string;
  dataIndex?: string;
}

const TableColumn = forwardRef<HTMLDivElement, TableColumnProps>(
  ({ title, style, className, "data-component-id": id, ...restProps }, ref) => {
    return (
      <div
        ref={ref}
        data-component-id={id}
        className={className}
        style={{
          ...style,
          padding: "16px",
          width: "100%",
          height: "100%",
          display: "flex",
          // 提示用户这里可以点、可以拖
          cursor: "move",
        }}
        {...restProps}
      >
        {/* 显示标题，若无标题显示默认文案 */}
        <span>{title || "列名"}</span>
      </div>
    );
  }
);

TableColumn.displayName = "TableColumn";
export default TableColumn;
