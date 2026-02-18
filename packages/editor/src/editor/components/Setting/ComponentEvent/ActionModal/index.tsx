/**
 * @file /src/editor/components/Setting/ComponentEvent/ActionModal/index.tsx
 * @description
 * 配置“动作”的模态框。它同样是一个分发器，
 * 根据用户选择的动作类型，渲染对应的配置表单。
 * @module Components/Setting/ComponentEvent/ActionModal
 */
import { useEffect, useState } from "react";
import { Modal, Segmented } from "antd";
import { GoToLink, type GoToLinkConfig } from "../actions/GoToLink";
import { ShowMessage, type ShowMessageConfig } from "../actions/ShowMessage";
import { CustomJS, type CustomJsConfig } from "../actions/CustomJs";
import {
  ComponentMethod,
  type ComponentMethodConfig,
} from "../actions/ComponentMethod";

// 定义所有可能的动作配置类型
export type ActionConfig =
  | GoToLinkConfig
  | ShowMessageConfig
  | CustomJsConfig
  | ComponentMethodConfig;

interface ActionModalProps {
  visible: boolean;
  action?: ActionConfig; // 传入的动作配置，用于编辑时回显
  handleOk: (config?: ActionConfig) => void;
  handleCancel: () => void;
}

export function ActionModal(props: ActionModalProps) {
  const { visible, handleCancel, handleOk, action } = props;

  // State: 当前选中的动作类型 Tab
  const [key, setKey] = useState<string>("访问链接");
  // State: 当前模态框中正在编辑的动作配置对象
  const [curConfig, setCurConfig] = useState<ActionConfig>();

  const map = {
    goToLink: "访问链接",
    showMessage: "消息提示",
    customJs: "自定义 JS",
    componentMethod: "组件方法",
  };

  // 1. 使用 effect 在模态框可见时，用 action prop 初始化内部状态
  useEffect(() => {
    if (visible) {
      // 将外部的 action 同步到内部的 curConfig state
      setCurConfig(action);

      // 根据 action 设置 Tab，如果是新增则设为默认值
      if (action?.type) {
        setKey(map[action.type]);
      } else {
        setKey("访问链接");
      }
    }
  }, [visible, action]);

  return (
    <Modal
      title="事件动作配置"
      width={800}
      open={visible}
      okText="添加"
      cancelText="取消"
      onOk={() => handleOk(curConfig)}
      onCancel={handleCancel}
      // 关键：添加 destroyOnClose，确保每次打开都是一个全新的干净状态，避免旧 state 的干扰
      destroyOnHidden
    >
      <div className="h-[500px]">
        <Segmented
          value={key}
          onChange={setKey}
          block
          options={["访问链接", "消息提示", "自定义 JS", "组件方法"]}
        />
        {/* 所有表单的 value 都从 curConfig 读取，形成数据闭环 */}
        {key === "访问链接" && (
          <GoToLink
            key="goToLink"
            value={curConfig?.type === "goToLink" ? curConfig.url : ""}
            onChange={(config) => {
              setCurConfig(config);
            }}
          />
        )}
        {key === "消息提示" && (
          <ShowMessage
            key="showMessage"
            value={
              curConfig?.type === "showMessage" ? curConfig.config : undefined
            }
            onChange={(config) => {
              setCurConfig(config);
            }}
          />
        )}
        {key === "组件方法" && (
          <ComponentMethod
            key="showMessage"
            value={
              curConfig?.type === "componentMethod"
                ? curConfig.config
                : undefined
            }
            onChange={(config) => {
              setCurConfig(config);
            }}
          />
        )}
        {key === "自定义 JS" && (
          <CustomJS
            key="customJS"
            value={curConfig?.type === "customJs" ? curConfig.code : ""}
            onChange={(config) => {
              setCurConfig(config);
            }}
          />
        )}
      </div>
    </Modal>
  );
}
