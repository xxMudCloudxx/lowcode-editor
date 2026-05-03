/**
 * @file CodePreview — 出码效果实时预览组件
 * @description
 * 基于 Sandpack 实现浏览器端编译预览，确保预览效果与出码产物一致。
 *
 * 核心流程：
 * 1. 接收出码流水线生成的 IGeneratedFile[]
 * 2. 转换为 Sandpack 文件格式
 * 3. 在嵌入式 iframe 中编译运行
 *
 * @module Editor/Components/CodePreview
 */

import { useMemo, useState } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import type { IGeneratedFile } from "@lowcode/schema";
import { Spin, Alert, Segmented } from "antd";

export interface CodePreviewProps {
  /** 出码流水线生成的文件列表 */
  files: IGeneratedFile[];
  /** 当前框架方案 */
  framework: "react" | "vue";
  /** 是否正在加载 */
  loading?: boolean;
  /** 预览区域高度 */
  height?: number | string;
}

/**
 * 将 IGeneratedFile[] 转换为 Sandpack 文件格式
 */
function toSandpackFiles(files: IGeneratedFile[]): SandpackFiles {
  const result: SandpackFiles = {};

  for (const file of files) {
    // Sandpack 需要以 / 开头的路径
    const path = file.filePath.startsWith("/")
      ? file.filePath
      : `/${file.filePath}`;

    result[path] = {
      code: file.content,
    };
  }

  return result;
}

/**
 * 从 package.json 提取依赖
 */
function extractDependencies(
  files: IGeneratedFile[],
): Record<string, string> | undefined {
  const packageJsonFile = files.find(
    (f) => f.fileName === "package.json" || f.filePath === "package.json",
  );

  if (!packageJsonFile) {
    return undefined;
  }

  try {
    const packageJson = JSON.parse(packageJsonFile.content);
    return packageJson.dependencies;
  } catch {
    console.warn("[CodePreview] 解析 package.json 失败");
    return undefined;
  }
}

/**
 * 获取入口文件路径
 */
function getEntryFile(
  files: IGeneratedFile[],
  framework: "react" | "vue",
): string {
  // 优先查找 main.tsx / main.ts
  const mainFile = files.find(
    (f) =>
      f.filePath === "src/main.tsx" ||
      f.filePath === "src/main.ts" ||
      f.filePath === "/src/main.tsx" ||
      f.filePath === "/src/main.ts",
  );

  if (mainFile) {
    return mainFile.filePath.startsWith("/")
      ? mainFile.filePath
      : `/${mainFile.filePath}`;
  }

  // 回退到默认入口
  return framework === "react" ? "/src/main.tsx" : "/src/main.ts";
}

/**
 * 出码效果实时预览组件
 *
 * @example
 * ```tsx
 * <CodePreview
 *   files={generatedFiles}
 *   framework="react"
 *   height={500}
 * />
 * ```
 */
export function CodePreview({
  files,
  framework,
  loading = false,
  height = 500,
}: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");

  // 转换文件格式
  const sandpackFiles = useMemo(() => toSandpackFiles(files), [files]);

  // 提取依赖
  const dependencies = useMemo(() => extractDependencies(files), [files]);

  // 获取入口文件
  const entryFile = useMemo(
    () => getEntryFile(files, framework),
    [files, framework],
  );

  // 文件为空时显示提示
  if (files.length === 0 && !loading) {
    return (
      <Alert
        message="暂无预览内容"
        description="请先搭建页面并生成代码"
        type="info"
        showIcon
      />
    );
  }

  // 加载中状态
  if (loading) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <Spin tip="正在生成代码..." size="large" />
      </div>
    );
  }

  // Sandpack 模板配置
  const template = framework === "react" ? "react-ts" : "vue-ts";

  return (
    <SandpackProvider
      template={template}
      files={sandpackFiles}
      customSetup={{
        dependencies: dependencies || {},
        entry: entryFile,
      }}
      options={{
        recompileMode: "delayed",
        recompileDelay: 500,
      }}
    >
      <SandpackLayout style={{ borderRadius: 8, height }}>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Tab 切换器 */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #e8e8e8" }}>
            <Segmented
              value={activeTab}
              onChange={(v) => setActiveTab(v as "preview" | "console")}
              options={[
                { label: "预览", value: "preview" },
                { label: "控制台", value: "console" },
              ]}
              size="small"
            />
          </div>
          {/* 内容区域 - 用 CSS 控制显示隐藏，避免重新挂载 */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute",
              inset: 0,
              display: activeTab === "preview" ? "block" : "none"
            }}>
              <SandpackPreview
                style={{ height: "100%" }}
                showOpenInCodeSandbox={false}
                showRefreshButton
              />
            </div>
            <div style={{
              position: "absolute",
              inset: 0,
              display: activeTab === "console" ? "block" : "none"
            }}>
              <SandpackConsole style={{ height: "100%" }} />
            </div>
          </div>
        </div>
      </SandpackLayout>
    </SandpackProvider>
  );
}

export default CodePreview;
