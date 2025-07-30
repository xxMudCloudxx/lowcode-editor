import type { ComponentConfig } from "../../../stores/component-config";
import { PT_GENERAL } from "../../containerTypes";

export default {
  name: "Select",
  desc: "选择器",
  category: "数据录入",
  defaultProps: {
    options: [
      { value: "jack", label: "Jack" },
      { value: "lucy", label: "Lucy" },
      { value: "Yiminghe", label: "yiminghe" },
    ],
    styles: {
      width: "100px",
    },
  },
  parentTypes: PT_GENERAL,
  setter: [
    {
      name: "options",
      label: "选项",
      type: "custom",
      component: "AttrListSetter",
      props: {
        itemProps: [
          { name: "label", label: "标签" },
          { name: "value", label: "值" },
        ],
        defaultItem: { label: "新选项", value: "new-option" },
      },
    },
  ],
} as Omit<ComponentConfig, "dev" | "prod">;
