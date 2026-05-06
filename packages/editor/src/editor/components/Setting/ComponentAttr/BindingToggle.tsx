import { LinkOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

interface BindingToggleProps {
  isBound: boolean;
  onToggle: () => void;
}

export function BindingToggle({ isBound, onToggle }: BindingToggleProps) {
  return (
    <Tooltip title={isBound ? "切换为静态值" : "切换为表达式绑定"}>
      <Button
        type={isBound ? "primary" : "default"}
        size="small"
        icon={<LinkOutlined />}
        onClick={onToggle}
        aria-label={isBound ? "切换为静态值" : "切换为表达式绑定"}
      />
    </Tooltip>
  );
}
