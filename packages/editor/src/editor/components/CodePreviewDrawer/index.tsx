import React, { useState, useEffect } from "react";
import { Drawer, Layout, Tree, Button, Spin, Empty, Space, Select } from "antd";
import type { TreeDataNode } from "antd";
import Editor from "@monaco-editor/react";
import type { IGeneratedFile } from "@lowcode/schema";
import { buildFileTree, getFileLanguage } from "../../utils/fileTree";
import { openInCodeSandbox } from "../../utils/openInCodeSandbox"; // 保留
import { downloadBlob, getRegisteredSolutions } from "@lowcode/code-generator";
import { zipPublisher } from "@lowcode/code-generator/src/publisher/zip-publisher";

const { Sider, Content } = Layout;

interface CodePreviewDrawerProps {
  visible: boolean;
  files: IGeneratedFile[];
  onClose: () => void;
  loading: boolean;
  solution: string;
  onSolutionChange: (solution: string) => void;
}

export const CodePreviewDrawer: React.FC<CodePreviewDrawerProps> = ({
  visible,
  files,
  onClose,
  loading,
  solution,
  onSolutionChange,
}) => {
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<IGeneratedFile | null>(null);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [availableSolutions, setAvailableSolutions] = useState<string[]>([]);

  useEffect(() => {
    // 获取所有注册的 Solutions
    setAvailableSolutions(getRegisteredSolutions());
  }, []);

  useEffect(() => {
    // 用于构建文件树
    if (visible && files.length > 0) {
      const fileTree = buildFileTree(files);
      setTreeData(fileTree);

      // 尝试保持之前选中的文件，如果不存在则选中默认的
      const currentFilePath = selectedFile?.filePath;
      const sameFile = currentFilePath
        ? files.find((f) => f.filePath === currentFilePath)
        : null;

      const defaultFile =
        sameFile ||
        files.find((f) => f.fileName === "package.json") ||
        files.find((f) => f.fileName === "main.tsx") ||
        files[0];
      setSelectedFile(defaultFile);
    }
  }, [visible, files]); // selectedFile 不在依赖里，防止循环重置

  const handleSelect = (
    _selectedKeys: React.Key[],
    info: { node: TreeDataNode & { fileData?: IGeneratedFile } },
  ) => {
    if (info.node.isLeaf && info.node.fileData) {
      setSelectedFile(info.node.fileData);
    }
  };

  const handleOpenCodeSandbox = async () => {
    setIsSandboxLoading(true);
    try {
      await openInCodeSandbox(files);
    } catch (error) {
      console.error("Failed to open in CodeSandbox:", error);
    } finally {
      setIsSandboxLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsZipLoading(true);
    try {
      const projectName = "my-lowcode-project";
      const result = await zipPublisher.publish(files, {
        projectName: projectName,
      });
      const blob = result.blob;
      downloadBlob(blob, `${projectName}.zip`);
    } catch (error) {
      console.error("Failed to download ZIP:", error);
    } finally {
      setIsZipLoading(false);
    }
  };

  const drawerTitle = (
    <div className="flex justify-between items-center pr-8">
      <Space>
        <span>源码预览</span>
        <Select
          value={solution}
          onChange={onSolutionChange}
          style={{ width: 150 }}
          options={availableSolutions.map((s) => ({ label: s, value: s }))}
          size="small"
        />
      </Space>
      <Space>
        <Button loading={isZipLoading} onClick={handleDownloadZip}>
          下载ZIP
        </Button>
        <Button
          type="primary"
          loading={isSandboxLoading}
          onClick={handleOpenCodeSandbox}
        >
          在 CodeSandbox 中打开
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      title={drawerTitle}
      placement="right"
      onClose={onClose}
      open={visible}
      width="80vw"
      height="100vh"
    >
      <Spin spinning={loading} size="large" className="h-full">
        {!loading && files.length > 0 ? (
          <Layout className="h-full overflow-hidden">
            {/* Sider: 文件树 */}
            <Sider
              width={250}
              theme="light"
              className="overflow-auto border-r border-gray-200 h-full"
            >
              <Tree
                showLine
                showIcon
                treeData={treeData}
                onSelect={handleSelect}
                defaultExpandAll
                defaultExpandParent
                selectedKeys={selectedFile ? [selectedFile.filePath] : []}
                className="p-2 file-tree"
              />
            </Sider>

            {/* Content: 代码编辑器 */}
            <Content className="h-screen overflow-hidden">
              <div className="h-full">
                {selectedFile ? (
                  <Editor
                    height="100%" // 占满 Content
                    language={getFileLanguage(selectedFile.fileType)}
                    value={selectedFile.content}
                    options={{ readOnly: true }}
                  />
                ) : (
                  <Empty
                    description="请在左侧选择一个文件"
                    className="flex flex-col items-center justify-center h-full"
                  />
                )}
              </div>
            </Content>
          </Layout>
        ) : (
          // 切换了判断条件
          !loading && (
            <Empty
              description="未生成任何文件"
              className="flex flex-col items-center justify-center h-full"
            />
          )
        )}
      </Spin>
    </Drawer>
  );
};
