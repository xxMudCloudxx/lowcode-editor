import { useComponetsStore } from "../../../../stores/components";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";

export interface GoToLinkConfig {
  type: "goToLink";
  url: string;
}

export interface GoToLinkProps {
  value?: string;
  defaultValue?: string;
  onChange?: (config: GoToLinkConfig) => void;
}

export function GoToLink(props: GoToLinkProps) {
  const { defaultValue, onChange, value: val } = props;

  const { curComponentId } = useComponetsStore();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(val);
  }, [val]);

  function urlChange(value: string) {
    if (!curComponentId) return;

    setValue(value);

    onChange?.({
      type: "goToLink",
      url: value,
    });
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          跳转链接
        </label>
        <TextArea
          className="w-full resize-none border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          placeholder="请输入跳转链接地址..."
          rows={6}
          onChange={(e) => {
            urlChange(e.target.value);
          }}
          value={value || ""}
        />
      </div>
    </div>
  );
}
