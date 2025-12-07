/**
 * @file Table/index.tsx
 * @description 纯净的 Table 物料组件
 */
import { forwardRef, Children, isValidElement } from "react";
import { Table as AntdTable, type TableProps as AntdTableProps } from "antd";
import type { MaterialProps } from "../../interface";

// 继承 Antd Table Props，但排除我们接管的 columns 和 dataSource
export interface TableProps
  extends Omit<AntdTableProps<any>, "columns" | "dataSource">,
    MaterialProps {}

const Table = forwardRef<HTMLDivElement, TableProps>(
  (
    {
      children,
      style,
      className,
      "data-component-id": id,
      showHeader = true,
      ...props
    },
    ref
  ) => {
    // 🧙‍♂️ 核心魔法：将 React 子节点映射为 Antd 列配置
    const columns = Children.map(children, (child, index) => {
      if (!isValidElement(child)) return null;

      return {
        // 1. 关键：直接把 child (即 DraggableNode 包裹的 TableColumn) 塞给 title
        title: child,

        // 2. 必须要有 key，用 index 兜底
        key: child.key || `col-${index}`,

        // 3. 必须有 dataIndex 才能显示出格子
        dataIndex: `col-${index}`,

        // 4. 消除 Antd 表头默认 padding，让 TableColumn 组件撑满整个 th
        onHeaderCell: () => ({
          style: { padding: 0 },
        }),
      };
    })?.filter(Boolean);

    return (
      <div
        ref={ref}
        data-component-id={id}
        style={{
          width: "100%",
          minHeight: 100,
          position: "relative",
          ...style,
        }}
        className={className}
      >
        <AntdTable
          columns={columns as any}
          // 给一行假数据，确保列能撑开
          dataSource={[{ key: "1" }]}
          pagination={false}
          showHeader={showHeader}
          style={{ width: "100%" }}
          // 设置行高让表格更好看
          onRow={() => ({
            style: { height: 48 },
          })}
          {...props}
        />

        {/* 空状态保护：如果没有列，给个提示 */}
        {(!columns || columns.length === 0) && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              border: "1px dashed #ccc",
              color: "#999",
            }}
          >
            请拖拽 TableColumn 组件到这里
          </div>
        )}
      </div>
    );
  }
);

Table.displayName = "Table";
export default Table;
