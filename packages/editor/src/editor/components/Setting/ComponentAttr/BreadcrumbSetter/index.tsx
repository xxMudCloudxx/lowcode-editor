import { Button, Input, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

// 定义面包屑项目的类型
interface BreadcrumbItem {
  title: string;
  href?: string;
}

// 定义组件接收的 props，同样将 value 和 onChange 设为可选，以兼容 antd Form
interface BreadcrumbSetterProps {
  value?: BreadcrumbItem[];
  onChange?: (value: BreadcrumbItem[]) => void;
}

export const BreadcrumbSetter = ({
  value = [],
  onChange,
}: BreadcrumbSetterProps) => {
  // 添加一项
  const handleAdd = () => {
    // 使用可选链调用 onChange，并传递一个追加了新元素的数组
    onChange?.([...value, { title: "新页面", href: "#" }]);
  };

  // 删除一项
  const handleDelete = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange?.(newValue);
  };

  // 修改一项的属性
  const handleItemChange = (
    index: number,
    key: keyof BreadcrumbItem,
    itemValue: string
  ) => {
    const newValue = value.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: itemValue };
      }
      return item;
    });
    onChange?.(newValue);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {value.map((item, index) => (
        <Space.Compact key={index} block>
          <Input
            placeholder="标题"
            value={item.title}
            onChange={(e) => handleItemChange(index, "title", e.target.value)}
          />
          <Input
            placeholder="链接"
            value={item.href}
            onChange={(e) => handleItemChange(index, "href", e.target.value)}
          />
          <Button
            icon={<DeleteOutlined />}
            type="dashed"
            danger
            onClick={() => handleDelete(index)}
          />
        </Space.Compact>
      ))}
      <Button type="dashed" onClick={handleAdd} block icon={<PlusOutlined />}>
        添加一项
      </Button>
    </div>
  );
};
