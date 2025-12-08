/**
 * @file Typography/index.tsx
 * @description 纯净的 Typography 物料组件
 *
 * 支持 Text, Title, Paragraph 三种类型
 * 根据类型动态选择合适的 wrapper 元素
 *
 * 设计说明：
 * - Text 使用 span 包裹（inline 元素）
 * - Title/Paragraph 使用 div 包裹（block 元素）
 * 这样可以保持正确的语义和布局行为
 */
import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { Typography as AntdTypography } from "antd";

const { Title, Text, Paragraph } = AntdTypography;

// Omit content from HTMLAttributes to avoid conflict with our content prop (ReactNode vs string)
export interface TypographyProps
  extends Omit<HTMLAttributes<HTMLElement>, "content"> {
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
 * Wrapper 元素根据类型动态选择：
 * - Text: span (inline)
 * - Title/Paragraph: div (block)
 */
const Typography = forwardRef<HTMLElement, TypographyProps>(
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
      ...restProps
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

    // Text 使用 span（inline），Title/Paragraph 使用 div（block）
    const isBlockType = type === "Title" || type === "Paragraph";
    const Wrapper = isBlockType ? "div" : "span";

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
      <Wrapper
        ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>}
        style={style}
        {...restProps}
      >
        {renderTypography()}
      </Wrapper>
    );
  }
);

Typography.displayName = "Typography";

export default Typography;
