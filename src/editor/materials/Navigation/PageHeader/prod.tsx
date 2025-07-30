import { Space, Typography } from "antd";
import type { CommonComponentProps } from "../../../interface";

const { Title, Text } = Typography;

const PageHeaderProd = ({ styles, title, subTitle }: CommonComponentProps) => {
  return (
    <div
      style={{
        ...styles,
        borderBottom: "1px solid #f0f0f0",
        padding: "16px 24px",
        backgroundColor: "#fff",
      }}
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

export default PageHeaderProd;
