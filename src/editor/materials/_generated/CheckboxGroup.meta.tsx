/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请调整脚本或 TARGETS。
 */
import type { ComponentConfig } from '../../stores/component-config';
import { Checkbox } from 'antd';

const meta = {
  name: "CheckboxGroup",
  desc: "多选组",
  defaultProps: {},
  setter: [
  {
    "name": "name",
    "label": "name",
    "type": "input"
  },
  {
    "name": "defaultValue",
    "label": "defaultValue",
    "type": "input"
  },
  {
    "name": "value",
    "label": "value",
    "type": "input"
  },
  {
    "name": "options",
    "label": "options",
    "type": "inputNumber"
  },
  {
    "name": "disabled",
    "label": "disabled",
    "type": "switch"
  }
],
  events: [
  {
    "name": "onChange",
    "label": "onChange"
  }
],
  parentTypes: ["Page", "Container", "Modal"]
} as Omit<ComponentConfig, "dev" | "prod">;

export default meta;
