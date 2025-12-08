/**
 * @file PageHeader/index.tsx
 * @description 纯净的页头组件
 *
 * PageHeader 是自定义实现（非 Antd），需要保留 div 作为根元素
 */
import { forwardRef } from "react";
import { Space, Typography } from "antd";
import type { MaterialProps } from "../../interface";

const { Title, Text } = Typography;

export interface PageHeaderProps extends MaterialProps {
  title?: string;
  subTitle?: string;
}

const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ style, className, title = "页面标题", subTitle, ...restProps }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          border: "1px solid #f0f0f0",
          padding: "16px 24px",
          ...style,
        }}
        className={className}
        {...restProps}
      >
        <Space direction="vertical">
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {subTitle && <Text type="secondary">{subTitle}</Text>}
        </Space>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export default PageHeader;
