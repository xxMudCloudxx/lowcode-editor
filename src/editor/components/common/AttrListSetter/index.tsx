import { Button, Form, Input, Modal, Space } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

// --- 类型定义 (保持不变) ---
interface ItemProperty {
  name: string;
  label: string;
}

interface ListSetterProps {
  value?: Record<string, any>[];
  onChange?: (value: Record<string, any>[]) => void;
  defaultItem: Record<string, any>;
  itemProps: ItemProperty[];
}
// ==================== 1. 重构 SortableItem 为“展示模式” ====================
interface SortableItemProps {
  id: UniqueIdentifier;
  item: Record<string, any>;
  itemProps: ItemProperty[];
  index: number;
  onDelete: (index: number) => void;
  onEdit: (index: number) => void; // 新增 onEdit 回调
}

const SortableItem = ({
  id,
  item,
  itemProps,
  index,
  onDelete,
  onEdit,
}: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
        padding: "4px",
        borderRadius: "4px",
        background: "#fff",
      }}
      {...attributes}
    >
      <Button
        type="text"
        {...listeners}
        icon={<HolderOutlined />}
        style={{ cursor: "grab", flexShrink: 0 }}
      />
      <div
        style={{ display: "flex", flexGrow: 1, gap: "8px", overflow: "hidden" }}
      >
        {itemProps.map((prop: ItemProperty) => (
          // 将 Input 改为 div 展示文本，防止内容过长时溢出
          <div
            key={prop.name}
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={item[prop.name]}
          >
            {item[prop.name]}
          </div>
        ))}
      </div>
      <Space style={{ flexShrink: 0 }}>
        <Button
          icon={<EditOutlined />}
          type="text"
          onClick={() => onEdit(index)}
        />
        <Button
          icon={<DeleteOutlined />}
          type="text"
          danger
          onClick={() => onDelete(index)}
        />
      </Space>
    </div>
  );
};

export const AttrListSetter = ({
  value = [],
  onChange,
  defaultItem,
  itemProps,
}: ListSetterProps) => {
  const [form] = Form.useForm();

  // State for modal visibility and the item being edited
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = value.findIndex((item) => item.key === active.id);
      const newIndex = value.findIndex((item) => item.key === over.id);
      onChange?.(arrayMove(value, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    const newItem = { ...defaultItem, key: `new-item-${Date.now()}` };
    onChange?.([...value, newItem]);
  };

  const handleDelete = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange?.(newValue);
  };

  // 打开弹窗进行编辑
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    form.setFieldsValue(value[index]);
    setIsModalVisible(true);
  };

  // 弹窗确认，保存修改
  const handleOk = () => {
    form
      .validateFields()
      .then((formValues) => {
        if (editingIndex === null) return;
        const newValue = value.map((item, i) =>
          i === editingIndex ? { ...item, ...formValues } : item
        );
        onChange?.(newValue);
        setIsModalVisible(false);
        setEditingIndex(null);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingIndex(null);
  };
  const itemsWithKeys = value.map((item, index) => ({
    ...item,
    key: item.key || `item-${index}`,
  }));

  return (
    <div
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: "6px",
        border: "1px solid #e5e7eb", // 增加一层精致的边框
      }}
    >
      {/* 这是经过美化的“表头”行 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingBottom: "6px", // 增加一点下边距
          marginBottom: "6px", // 与列表内容拉开距离
          borderBottom: "1px solid #e5e7eb", // 增加底部分割线
        }}
      >
        {/* 精确对齐“拖拽手柄”的占位符 */}
        <div style={{ width: "32px", flexShrink: 0 }} />
        <div style={{ display: "flex", flexGrow: 1, gap: "8px" }}>
          {itemProps.map((prop) => (
            <div
              key={prop.name}
              style={{
                flex: 1,
                fontSize: "12px",
                fontWeight: 500, // 字体稍微加粗
                textTransform: "uppercase", // 字母大写，增加设计感
                letterSpacing: "0.05em", // 增加字间距
              }}
            >
              {prop.label}
            </div>
          ))}
        </div>
        {/* 精确对齐“删除按钮”的占位符 */}
        <div style={{ width: "32px", flexShrink: 0 }} />
      </div>

      {/* 列表内容区域 (保持不变) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemsWithKeys.map((i) => i.key)}
          strategy={verticalListSortingStrategy}
        >
          {itemsWithKeys.map((item, index) => (
            <SortableItem
              key={item.key}
              id={item.key}
              item={item}
              itemProps={itemProps}
              index={index}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </SortableContext>
        <Button
          type="dashed"
          onClick={handleAdd}
          block
          icon={<PlusOutlined />}
          style={{ marginTop: "8px" }} // 给添加按钮也增加一点上边距
        >
          添加一项
        </Button>
      </DndContext>
      {/* 编辑弹窗 */}
      <Modal
        title={`编辑第 ${editingIndex !== null ? editingIndex + 1 : ""} 项`}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose // 关闭时销毁内部组件，保证每次打开都是新的
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingIndex !== null ? value[editingIndex] : {}}
        >
          {itemProps.map((prop) => (
            <Form.Item
              key={prop.name}
              name={prop.name}
              label={prop.label}
              rules={[{ required: true, message: `请输入${prop.label}` }]}
            >
              <Input />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};
export default AttrListSetter;
