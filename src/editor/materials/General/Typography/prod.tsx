import { Typography as AntdTypography } from "antd";
import type { CommonComponentProps } from "../../../interface";

const { Title, Text, Paragraph } = AntdTypography;

const TypographyProd = ({
  styles,
  content,
  type,
  id,
  children,
  ...props
}: CommonComponentProps) => {
  const renderTypography = () => {
    switch (type) {
      case "Title":
        return (
          <Title {...props} id={String(id)} style={styles}>
            {content}
          </Title>
        );
      case "Paragraph":
        return (
          <Paragraph {...props} id={String(id)} style={styles}>
            {content}
          </Paragraph>
        );
      default:
        return (
          <Text {...props} id={String(id)} style={styles}>
            {content}
          </Text>
        );
    }
  };

  return renderTypography();
};

export default TypographyProd;
