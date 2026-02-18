/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Upload",
  desc: "Upload",
  category: "DataEntry",
  defaultProps: {},
  setter: [
  {
    "name": "type",
    "label": "类型",
    "type": "select",
    "options": [
      {
        "label": "drag",
        "value": "drag"
      },
      {
        "label": "select",
        "value": "select"
      }
    ]
  },
  {
    "name": "defaultFileList",
    "label": "defaultFileList",
    "type": "input"
  },
  {
    "name": "fileList",
    "label": "fileList",
    "type": "input"
  },
  {
    "name": "action",
    "label": "action",
    "type": "input"
  },
  {
    "name": "directory",
    "label": "directory",
    "type": "switch"
  },
  {
    "name": "data",
    "label": "data",
    "type": "input"
  },
  {
    "name": "method",
    "label": "method",
    "type": "select",
    "options": [
      {
        "label": "POST",
        "value": "POST"
      },
      {
        "label": "PUT",
        "value": "PUT"
      },
      {
        "label": "PATCH",
        "value": "PATCH"
      },
      {
        "label": "post",
        "value": "post"
      },
      {
        "label": "put",
        "value": "put"
      },
      {
        "label": "patch",
        "value": "patch"
      }
    ]
  },
  {
    "name": "headers",
    "label": "headers",
    "type": "input"
  },
  {
    "name": "showUploadList",
    "label": "showUploadList",
    "type": "switch"
  },
  {
    "name": "multiple",
    "label": "multiple",
    "type": "switch"
  },
  {
    "name": "accept",
    "label": "accept",
    "type": "input"
  },
  {
    "name": "beforeUpload",
    "label": "beforeUpload",
    "type": "input"
  },
  {
    "name": "listType",
    "label": "listType",
    "type": "select",
    "options": [
      {
        "label": "text",
        "value": "text"
      },
      {
        "label": "picture",
        "value": "picture"
      },
      {
        "label": "picture-card",
        "value": "picture-card"
      },
      {
        "label": "picture-circle",
        "value": "picture-circle"
      }
    ]
  },
  {
    "name": "supportServerRender",
    "label": "supportServerRender",
    "type": "switch"
  },
  {
    "name": "disabled",
    "label": "禁用",
    "type": "switch"
  },
  {
    "name": "customRequest",
    "label": "customRequest",
    "type": "input"
  },
  {
    "name": "withCredentials",
    "label": "withCredentials",
    "type": "switch"
  },
  {
    "name": "openFileDialogOnClick",
    "label": "openFileDialogOnClick",
    "type": "switch"
  },
  {
    "name": "locale",
    "label": "locale",
    "type": "input"
  },
  {
    "name": "previewFile",
    "label": "previewFile",
    "type": "input"
  },
  {
    "name": "transformFile",
    "label": "transformFile",
    "type": "input"
  },
  {
    "name": "iconRender",
    "label": "iconRender",
    "type": "input"
  },
  {
    "name": "isImageUrl",
    "label": "isImageUrl",
    "type": "switch"
  },
  {
    "name": "progress",
    "label": "progress",
    "type": "input"
  },
  {
    "name": "itemRender",
    "label": "itemRender",
    "type": "input"
  },
  {
    "name": "maxCount",
    "label": "maxCount",
    "type": "inputNumber"
  },
  {
    "name": "hasControlInside",
    "label": "hasControlInside",
    "type": "switch"
  },
  {
    "name": "pastable",
    "label": "pastable",
    "type": "switch"
  }
],
  events: [
  {
    "name": "onChange",
    "label": "onChange事件"
  },
  {
    "name": "onDrop",
    "label": "onDrop事件"
  },
  {
    "name": "onPreview",
    "label": "onPreview事件"
  },
  {
    "name": "onDownload",
    "label": "onDownload事件"
  },
  {
    "name": "onRemove",
    "label": "onRemove事件"
  }
],
};

export default meta;
