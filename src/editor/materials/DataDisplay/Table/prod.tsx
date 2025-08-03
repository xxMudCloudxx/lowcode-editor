import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { CommonComponentProps } from "../../../interface";
import dayjs from "dayjs";
import axios from "axios";
import { Table as AntdTable } from "antd";

export interface TableRef {
  refresh: () => void;
}

/**
 * @description Table 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
const TableProd: React.ForwardRefRenderFunction<
  TableRef,
  Omit<CommonComponentProps, "ref">
> = ({ url, children }, ref) => {
  const [data, setData] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    if (url) {
      setLoading(true);

      try {
        const { data } = await axios.get(url);
        setData(data);
      } catch (error) {
        console.error("获取数据失败", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getData();
  }, [url]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      getData();
    },
  }));

  const columns = useMemo(() => {
    return React.Children.map(children, (suspenseElement: any) => {
      if (!suspenseElement) return null;
      const item = suspenseElement.props.children;
      if (item?.props?.type === "date") {
        return {
          title: item.props?.title,
          dataIndex: item.props?.dataIndex,
          render: (value: any) =>
            value ? dayjs(value).format("YYYY-MM-DD") : null,
        };
      } else {
        return {
          title: item.props?.title,
          dataIndex: item.props?.dataIndex,
        };
      }
    });
  }, [children]);

  return (
    <AntdTable
      columns={columns}
      dataSource={data}
      pagination={false}
      rowKey="id"
      loading={loading}
    />
  );
};

export default forwardRef(TableProd);
