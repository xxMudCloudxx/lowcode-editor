import { Typography as AntdTypography } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";

const { Title, Text, Paragraph } = AntdTypography;

const TypographyDev = ({
  id,
  name,
  styles,
  content,
  type,
  children,
  ...props
}: CommonComponentProps) => {
  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  const renderTypography = () => {
    switch (type) {
      case "Title":
        return (
          <Title {...props} style={styles}>
            {content}
          </Title>
        );
      case "Paragraph":
        return (
          <Paragraph {...props} style={styles}>
            {content}
          </Paragraph>
        );
      default:
        return (
          <Text {...props} style={styles}>
            {content}
          </Text>
        );
    }
  };

  return (
    <div ref={drag} data-component-id={id}>
      {renderTypography()}
    </div>
  );
};

export default TypographyDev;
