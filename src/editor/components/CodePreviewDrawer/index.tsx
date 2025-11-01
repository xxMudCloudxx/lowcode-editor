// src/editor/components/CodePreviewDrawer/index.tsx

import React, { useState, useEffect } from "react";
import { Drawer, Layout, Tree, Button, Spin, Empty, Space } from "antd";
import type { TreeDataNode } from "antd";
import Editor from "@monaco-editor/react";
import type { IGeneratedFile } from "../../../code-generator/types/ir";
import { buildFileTree, getFileLanguage } from "../../utils/fileTree";
import { openInCodeSandbox } from "../../utils/openInCodeSandbox";
import { zipPublisher } from "../../../code-generator/publisher/zip-publisher";
import { downloadBlob } from "../../../code-generator/utils/download";

const { Sider, Content } = Layout;

interface CodePreviewDrawerProps {
  visible: boolean;
  files: IGeneratedFile[];
  onClose: () => void;
  loading: boolean;
}

export const CodePreviewDrawer: React.FC<CodePreviewDrawerProps> = ({
  visible,
  files,
  onClose,
  loading,
}) => {
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<IGeneratedFile | null>(null);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);

  const [isZipLoading, setIsZipLoading] = useState(false);

  useEffect(() => {
    if (visible && files.length > 0) {
      // 1. 将扁平的文件列表转换为 Antd Tree 所需的树形结构
      const fileTree = buildFileTree(files);
      setTreeData(fileTree);

      // 2. 默认选中一个文件, 比如 package.json 或 main.tsx
      const defaultFile =
        files.find((f) => f.fileName === "package.json") ||
        files.find((f) => f.fileName === "main.tsx") ||
        files[0];
      setSelectedFile(defaultFile);
    }
  }, [visible, files]);

  // 3. 处理文件树点击
  const handleSelect = (
    _selectedKeys: React.Key[],
    info: { node: TreeDataNode & { fileData?: IGeneratedFile } }
  ) => {
    // 仅当点击的是文件（叶节点）时才更新
    if (info.node.isLeaf && info.node.fileData) {
      setSelectedFile(info.node.fileData);
    }
  };

  // 4. 处理 CodeSandbox 打开
  const handleOpenCodeSandbox = async () => {
    setIsSandboxLoading(true);
    try {
      // (注意：这里使用的是原始文件，暂不支持编辑器修改)
      await openInCodeSandbox(files);
    } catch (error) {
      console.error("Failed to open in CodeSandbox:", error);
    } finally {
      setIsSandboxLoading(false);
    }
  };

  // 添加 handleDownloadZip 函数
  const handleDownloadZip = async () => {
    setIsZipLoading(true);
    try {
      // 我们直接使用 props.files，无需重新生成代码
      const projectName = "my-lowcode-project";
      const blob = await zipPublisher(files, {
        projectName: projectName,
      });
      downloadBlob(blob, `${projectName}.zip`);
    } catch (error) {
      console.error("Failed to download ZIP:", error);
      // 可以在这里添加 antd 的 message.error 提示
    } finally {
      setIsZipLoading(false);
    }
  };

  const drawerTitle = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>源码预览</span>
      <Space>
        {/* 下载按钮 */}
        <Button loading={isZipLoading} onClick={handleDownloadZip}>
          下载ZIP
        </Button>

        {/*  CodeSandbox 按钮 */}
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
      width="80vw" // 占屏幕宽度的 80%
    >
      <Layout style={{ height: "100%" }}>
        {loading ? (
          <Spin size="large" style={{ margin: "auto" }} />
        ) : (
          <>
            <Sider
              width={240}
              style={{
                background: "#fff",
                overflow: "auto",
                borderRight: "1px solid #f0f0f0",
              }}
            >
              <Tree
                showLine
                showIcon
                treeData={treeData}
                onSelect={handleSelect}
                defaultExpandAll
                selectedKeys={selectedFile ? [selectedFile.filePath] : []}
              />
            </Sider>
            <Content style={{ height: "100%", display: "flex" }}>
              {selectedFile ? (
                <Editor
                  height="100%"
                  language={getFileLanguage(selectedFile.fileType)}
                  value={selectedFile.content}
                  options={{ readOnly: true }} // 默认只读
                />
              ) : (
                <Empty
                  description="请在左侧选择一个文件"
                  style={{ margin: "auto" }}
                />
              )}
            </Content>
          </>
        )}
      </Layout>
    </Drawer>
  );
};
