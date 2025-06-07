import React, { useEffect, useMemo, useRef } from "react";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";
import type { CommonComponentProps } from "../../interface";
import { useDrag } from "react-dnd";
import { Table as AntdTable } from "antd";

/**
 * @description Table 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function TableDev({ id, name, children, styles }: CommonComponentProps) {
  const { canDrop, drop } = useMaterailDrop(id, name);

  const divRef = useRef<HTMLDivElement>(null);

  const [_, drag] = useDrag({
    type: name,
    item: {
      type: name,
      dragType: "move",
      id: id,
    },
  });

  useEffect(() => {
    drop(divRef);
    drag(divRef);
  }, []);

  const columns = useMemo(() => {
    return React.Children.map(children, (item: any) => {
      return {
        title: (
          <div
            className="m-[-16px] p-[16px]"
            data-component-id={item.props?.id}
          >
            {item.props?.title}
          </div>
        ),
        dataIndex: item.props?.dataIndex,
        key: item,
      };
    });
  }, [children]);

  return (
    <div
      className={`w-[100%] ${
        canDrop ? "border-[2px] border-[blue]" : "border-[1px] border-[#000]"
      }`}
      ref={divRef}
      data-component-id={id}
      style={styles}
    >
      <AntdTable columns={columns} dataSource={[]} pagination={false} />
    </div>
  );
}

export default TableDev;
