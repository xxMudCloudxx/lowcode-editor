import { Input, Select } from "antd";
import { useComponetsStore } from "../../../../stores/components";
import { useEffect, useState } from "react";

export interface ShowMessageConfig {
  type: "showMessage";
  config: {
    type: "success" | "error";
    text: string;
  };
}

export interface ShowMessageProps {
  value?: ShowMessageConfig["config"];
  defaultValue?: ShowMessageConfig["config"];
  onChange?: (config: ShowMessageConfig) => void;
}

export function ShowMessage(props: ShowMessageProps) {
  const { defaultValue, onChange, value: val } = props;

  const { curComponentId } = useComponetsStore();

  const [type, setType] = useState<"success" | "error">(
    defaultValue?.type || "success"
  );
  const [text, setText] = useState<string>(defaultValue?.text || "");

  useEffect(() => {
    if (val) {
      setType(val.type);
      setText(val.text);
    }
  });
  function messageTypeChange(value: "success" | "error") {
    if (!curComponentId) return;

    setType(value);

    onChange?.({
      type: "showMessage",
      config: {
        type: value,
        text,
      },
    });
  }

  function messageTextChange(value: string) {
    if (!curComponentId) return;

    setText(value);

    onChange?.({
      type: "showMessage",
      config: {
        type,
        text: value,
      },
    });
  }

  return (
    <div className="pt-4 space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          消息类型
        </label>
        <Select
          className="w-full"
          size="large"
          placeholder="请选择消息类型"
          options={[
            { label: "成功消息", value: "success" },
            { label: "错误消息", value: "error" },
          ]}
          onChange={(value) => {
            messageTypeChange(value);
          }}
          value={type}
        />
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          消息内容
        </label>
        <Input
          className="w-full"
          size="large"
          placeholder="请输入消息内容..."
          onChange={(e) => {
            messageTextChange(e.target.value);
          }}
          value={text}
        />
      </div>
    </div>
  );
}
