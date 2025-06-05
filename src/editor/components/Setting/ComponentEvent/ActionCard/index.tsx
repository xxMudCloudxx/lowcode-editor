// ActionCard.tsx
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import React from "react";

export interface ActionCardProps {
  title: string;
  children?: any;
  onEdit: any;
  onDelete: any;
}
export const ActionCard = (props: ActionCardProps) => {
  const { title, children, onEdit, onDelete } = props;
  return (
    <div className="border border-[#aaa] m-[10px] p-[10px] relative">
      <div className="text-[blue]">{title}</div>
      <div>{children}</div>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 30,
          cursor: "pointer",
        }}
        onClick={onEdit}
      >
        <EditOutlined />
      </div>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          cursor: "pointer",
        }}
        onClick={onDelete}
      >
        <DeleteOutlined />
      </div>
    </div>
  );
};
