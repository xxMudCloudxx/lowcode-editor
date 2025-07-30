import { Space, Typography } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useRef } from "react";

const { Title, Text } = Typography;

const PageHeaderDev = ({
  id,
  styles,
  title,
  subTitle,
}: CommonComponentProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [_, drag] = useDrag({
    type: "PageHeader",
    item: {
      type: "PageHeader",
      dragType: "move",
      id: id,
    },
  });

  drag(divRef);

  return (
    <div
      ref={divRef}
      data-component-id={id}
      style={{ ...styles, border: "1px solid #f0f0f0", padding: "16px 24px" }}
    >
      <Space direction="vertical">
        <Title level={3} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{subTitle}</Text>
      </Space>
    </div>
  );
};

export default PageHeaderDev;
