/**
 * @file /src/editor/components/AiPageDesignerModal/index.tsx
 * @description
 * AI 页面设计器的模态框 UI。
 * 这是一个“无状态”组件，所有状态均从 `useAiPageDesignerStore` 订阅。
 * 它根据全局 store 中的 `status` 字段来渲染不同视图（idle, loading, success, error）。
 * @module Components/AiPageDesignerModal
 */
import {
  Modal,
  Button,
  Input,
  Spin,
  Upload,
  message,
  Result,
  Alert,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useAiPageDesignerStore } from "../../stores/aiPageDesigner";
import { useComponetsStore } from "../../stores/components";

const { TextArea } = Input;

/**
 * AI 页面设计器模态框组件
 * @returns {JSX.Element}
 */
export function AiPageDesignerModal() {
  // 1. 从我们的新 store 订阅所有状态和 actions
  const {
    isModalOpen,
    status,
    prompt,
    imageUrl,
    generatedSchema,
    errorMessage,
    closeModal,
    setPrompt,
    startGeneration,
    reset,
    //
  } = useAiPageDesignerStore();

  // 2. 从 useComponetsStore 获取 setComponents action，用于“应用” schema
  const setComponents = useComponetsStore((state) => state.setComponents);

  const handleGenerate = () => {
    if (!prompt && !imageUrl) {
      message.warning("请输入描述或上传图片");
      return;
    }
    // 调用全局 action，它会处理所有状态变更
    startGeneration(prompt, imageUrl);
  };

  /**
   * @function handleApply
   * @description [逻辑修改] 应用 Schema，然后重置(reset)回 idle 状态，而不是关闭模态框。
   * @description 这允许用户在应用后继续迭代修改。
   */
  const handleApply = () => {
    if (generatedSchema) {
      // 关键：将 AI 生成的 Schema 注入到主画布 store
      setComponents(generatedSchema);
      message.success("AI 页面已应用！");
      //
      reset();
    }
  };

  /**
   * @description 根据当前 status 渲染模态框的主内容。
   * @returns {JSX.Element}
   */
  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <Spin size="large" tip="AI 正在生成页面，请稍候..." />
            <p className="mt-4 text-gray-500">
              您可以暂时关闭此窗口，生成仍在后台继续。
            </p>
          </div>
        );

      case "success":
        return (
          <Result
            status="success"
            title="页面生成成功！"
            subTitle="您可以将生成的页面应用到画布，或返回修改。"
            extra={[
              <Button type="primary" key="apply" onClick={handleApply}>
                应用到画布
              </Button>,
              //
              <Button key="regenerate" onClick={reset}>
                返回修改
              </Button>,
            ]}
          />
        );

      case "error":
        return (
          <Result
            status="error"
            title="生成失败"
            subTitle="抱歉，AI 在生成时遇到了一个问题。"
            extra={[
              <Button type="primary" key="retry" onClick={handleGenerate}>
                重试
              </Button>,
              <Button key="back" onClick={reset}>
                返回修改
              </Button>,
            ]}
          >
            <Alert message={errorMessage} type="error" showIcon />
          </Result>
        );

      case "idle":
      default:
        return (
          <div className="flex flex-col gap-4">
            <TextArea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的页面，例如：&#10;“一个包含姓名、邮箱和提交按钮的用户表单”"
            />
            <Upload
              onChange={(info) => {
                // TODO: 在这里实现图片转 base64 并调用 setImageUrl
                message.info("图片上传功能待实现");
                console.log(info);
                // 示例：
                // const reader = new FileReader();
                // reader.onload = () => setImageUrl(reader.result as string);
                // reader.readAsDataURL(info.file.originFileObj);
              }}
              beforeUpload={() => false} // 阻止自动上传
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>上传 UI 截图 (可选)</Button>
            </Upload>
          </div>
        );
    }
  };

  /**
   * @description 根据当前 status 渲染模态框的 footer 按钮。
   * @returns {JSX.Element[] | null}
   */
  const renderFooter = () => {
    // 仅在 'idle' 状态下显示默认的“生成”和“取消”按钮
    if (status === "idle") {
      return [
        <Button key="cancel" onClick={closeModal}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleGenerate}>
          开始生成
        </Button>,
      ];
    }
    // 加载中、成功、失败状态，我们隐藏默认 footer
    return null;
  };

  return (
    <Modal
      title="AI 页面设计"
      open={isModalOpen}
      onCancel={closeModal}
      footer={renderFooter()}
      width={status === "idle" ? 600 : 520}
      // 这样即使用户关闭模态框，组件状态（和内部的 Spin）依然保留
      destroyOnHidden={false}
      centered
    >
      {renderContent()}
    </Modal>
  );
}
