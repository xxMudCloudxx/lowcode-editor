/**
 * @file TableColumn/index.tsx
 * @description 纯净的 TableColumn 组件
 */
import { forwardRef } from "react";
import type { MaterialProps } from "../../interface";

export interface TableColumnProps extends MaterialProps {
  /** 列标题 */
  title?: string;
  /** 数据字段名 - 用于绑定到数据源的字段 */
  dataIndex?: string;
  /**
   * 自定义单元格渲染函数
   * 在运行时会被传递给 Antd Table 的 columns[].render
   * 在编辑器模式下不生效
   */
  render?: (text: any, record: any, index: number) => React.ReactNode;
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
