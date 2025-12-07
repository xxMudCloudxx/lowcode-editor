/**
 * @file Typography/index.tsx
 * @description 纯净的 Typography 物料组件
 *
 * 支持 Text, Title, Paragraph 三种类型
 * 必须使用 forwardRef 支持 ref 转发
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Typography as AntdTypography } from "antd";

const { Title, Text, Paragraph } = AntdTypography;

// Omit content from HTMLAttributes to avoid conflict with our content prop (ReactNode vs string)
export interface TypographyProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "content"> {
  /** 文本内容 */
  content?: ReactNode;
  /** 排版类型 */
  type?: "Text" | "Title" | "Paragraph";
  /** 标题等级 (仅 Title 类型生效) */
  level?: 1 | 2 | 3 | 4 | 5;
  /** 加粗 */
  strong?: boolean;
  /** 斜体 */
  italic?: boolean;
  /** 下划线 */
  underline?: boolean;
  /** 删除线 */
  delete?: boolean;
  /** 代码样式 */
  code?: boolean;
  /** 标记样式 */
  mark?: boolean;
  /** 是否可复制 */
  copyable?: boolean;
  /** 是否可编辑 */
  editable?: boolean;
}

/**
 * Typography 物料组件
 *
 * 根据 type 属性渲染不同的排版组件
 * 使用 span 包裹以支持 ref 转发
 */
const Typography = forwardRef<HTMLSpanElement, TypographyProps>(
  (
    {
      content,
      type = "Text",
      style,
      level,
      strong,
      italic,
      underline,
      delete: deleteProp,
      code,
      mark,
      copyable,
      editable,
      ...restProps // 接收其他属性如 data-component-id
    },
    ref
  ) => {
    const typographyProps = {
      strong,
      italic,
      underline,
      delete: deleteProp,
      code,
      mark,
      copyable,
      editable,
    };

    const renderTypography = () => {
      switch (type) {
        case "Title":
          return (
            <Title level={level} {...typographyProps}>
              {content}
            </Title>
          );
        case "Paragraph":
          return <Paragraph {...typographyProps}>{content}</Paragraph>;
        default:
          return <Text {...typographyProps}>{content}</Text>;
      }
    };

    return (
      <span
        ref={ref}
        style={{ display: "inline-block", ...style }}
        {...restProps} // 转发 data-component-id 等属性
      >
        {renderTypography()}
      </span>
    );
  }
);

Typography.displayName = "Typography";

export default Typography;
