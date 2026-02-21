// src/code-generator/plugins/project/components.ts

/**
 * @file 项目级运行时组件生成插件
 * @description 向生成项目中注入 Page、PageHeader 等运行时 React 组件，供最终页面渲染使用。
 */

import type { IProjectPlugin, ProjectBuilder } from "@lowcode/schema";

// -----------------------------------------------------------------
// PageHeader 运行时 (Runtime) 代码
// (这是从 PageHeader/dev.tsx 适配而来，移除了 useDrag 和 ref)
// -----------------------------------------------------------------
const pageHeaderContent = `
import React from 'react';
import { Space, Typography } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  style?: React.CSSProperties;
  title: string;
  subTitle: string;
  className?: string;
}

/**
 * 自定义 PageHeader 组件 (运行时)
 */
const PageHeader: React.FC<PageHeaderProps> = ({ style, title, subTitle, className }) => {
  // 合并用户在编辑器中设置的 style 和组件的默认 style
  const combinedStyle: React.CSSProperties = {
    border: '1px solid #f0f0f0',
    padding: '16px 24px',
    ...style, // 允许编辑器的 style 覆盖默认值
  };

  return (
    <div style={combinedStyle} className={className}>
      <Space direction="vertical">
        <Title level={3} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{subTitle}</Text>
      </Space>
    </div>
  );
};

export default PageHeader;
`;

// -----------------------------------------------------------------
// Page 容器 (Wrapper) 运行时 (Runtime) 代码
// (这个对应你 component-metadata.ts 里的 "Page" 组件)
// -----------------------------------------------------------------
const pageContent = `
import React from 'react';

interface PageProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * 页面根容器 (运行时)
 */
const Page: React.FC<PageProps> = ({ children, style }) => {
  // 默认情况下，Page 只是一个简单的 div wrapper
  // 你可以在这里添加全局的 context providers 等
  return (
    <div className="page-wrapper" style={style}>
      {children}
    </div>
  );
};

export default Page;
`;

// -----------------------------------------------------------------
// 插件定义
// -----------------------------------------------------------------
const componentsPlugin: IProjectPlugin = {
  type: "project",
  name: "project-components",
  run: async (builder: ProjectBuilder) => {
    // 1. 添加 PageHeader 组件
    builder.addFile({
      fileName: "PageHeader.tsx",
      filePath: "src/components/PageHeader.tsx",
      fileType: "tsx",
      content: pageHeaderContent,
    });

    // 2. 添加 Page 容器组件
    builder.addFile({
      fileName: "Page.tsx",
      filePath: "src/components/Page.tsx",
      fileType: "tsx",
      content: pageContent,
    });

    // 3.  创建一个 index.ts 导出所有组件
    const indexContent = `
export { default as PageHeader } from './PageHeader';
export { default as Page } from './Page';
`;
    builder.addFile({
      fileName: "index.ts",
      filePath: "src/components/index.ts",
      fileType: "ts",
      content: indexContent,
    });
  },
};

export default componentsPlugin;
