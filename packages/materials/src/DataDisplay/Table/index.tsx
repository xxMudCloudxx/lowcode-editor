/**
 * @file Table/index.tsx
 * @description 纯净的 Table 物料组件
 *
 * 🏗️ Slot 模式：
 * - title: 使用 TableColumn 的 props.title（纯文本）
 * - render: 使用 TableColumn 的 children 作为单元格模板
 *
 * 📦 数据绑定：
 * - 使用 React Context 提供当前行数据（Scope）
 * - 表达式引擎或 MaterialWrapper 通过 useCellScope() 消费数据
 * - 将表达式（如 {{record.id}}）解析为实际值后传给子组件
 */
import React, {
  forwardRef,
  Children,
  isValidElement,
  createContext,
  useContext,
} from "react";
import { Table as AntdTable, type TableProps as AntdTableProps } from "antd";
import type { MaterialProps } from "../../interface";

// 类型安全的 CellScope，使用泛型
export interface CellScope<T = Record<string, unknown>> {
  /** 当前单元格绑定的数据值 */
  text: unknown;
  /** 当前行的完整数据对象 */
  record: T;
  /** 当前行索引 */
  rowIndex: number;
}

const CellScopeContext = createContext<CellScope | null>(null);

/**
 * Hook: 获取当前单元格的数据作用域
 * 供表达式引擎或 MaterialWrapper 使用，实现数据绑定
 */
export function useCellScope<
  T = Record<string, unknown>,
>(): CellScope<T> | null {
  return useContext(CellScopeContext) as CellScope<T> | null;
}

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
      "data-component-type": componentType,
      "data-is-container": isContainer,
      showHeader = true,
      ...props
    },
    ref
  ) => {
    // 将 React 子节点映射为 Antd 列配置
    const columns = Children.map(children, (child, index) => {
      if (!isValidElement(child)) return null;

      const childProps = child.props as Record<string, unknown>;

      // 获取唯一 ID
      const componentId = childProps["data-component-id"] as
        | string
        | number
        | undefined;
      const uniqueKey =
        componentId != null
          ? `col-${componentId}`
          : child.key || `col-fallback-${index}`;

      // 读取配置
      const userDataIndex = childProps.dataIndex as string | undefined;
      const cellTemplate = childProps.children as React.ReactNode;

      return {
        // 表头：渲染 child（让 TableColumn 可选中）
        title: child,
        key: uniqueKey,
        dataIndex: userDataIndex || uniqueKey,

        // 单元格渲染：Context 提供作用域，直接渲染模板
        render: (
          text: unknown,
          record: Record<string, unknown>,
          rowIndex: number
        ) => {
          if (!cellTemplate) return text;

          const scope: CellScope = { text, record, rowIndex };

          // Context 自动透传给所有子孙节点，无需手动 clone
          return (
            <CellScopeContext.Provider value={scope}>
              {cellTemplate}
            </CellScopeContext.Provider>
          );
        },

        onHeaderCell: () => ({
          style: { padding: "12px 16px", cursor: "pointer" },
        }),
      };
    })?.filter(Boolean);

    return (
      <div
        ref={ref}
        data-component-id={id}
        data-component-type={componentType}
        data-is-container={isContainer}
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
          dataSource={[{ key: "1" }]}
          pagination={false}
          showHeader={showHeader}
          style={{ width: "100%" }}
          onRow={() => ({ style: { height: 48 } })}
          {...props}
        />

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
