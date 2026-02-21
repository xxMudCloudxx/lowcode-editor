// src/code-generator/plugins/project/entry.ts

/**
 * @file 应用入口插件
 * @description 生成 src/main.tsx 和 src/App.tsx
 */

import type { IProjectPlugin } from "@lowcode/schema";

/**
 * 生成 App.tsx
 * 这是应用的根组件，负责引入全局样式和路由
 */
const getAppContent = (): string => `
/**
 * @file App 根组件
 * @description 由 lowcode-editor 自动生成
 */

import React from 'react';
import AppRouter from './router';

// --- 引入全局样式 ---
// (全局样式插件 global-style.ts 负责生成此文件)
import './global.scss'; 

const App: React.FC = () => {
  return (
    <div className="lowcode-app">
      <AppRouter />
    </div>
  );
};

export default App;
`;

/**
 * 生成 main.tsx
 * 这是 React 的渲染入口
 */
const getMainContent = (): string => `
/**
 * @file 应用渲染入口
 * @description 由 lowcode-editor 自动生成
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('未能找到 ID 为 "root" 的 DOM 节点，应用无法挂载。');
}
`;

const entryPlugin: IProjectPlugin = {
  type: "project",
  name: "react-entry",

  run: (projectBuilder) => {
    // 1. 添加 App.tsx
    projectBuilder.addFile({
      fileName: "App.tsx",
      filePath: "src/App.tsx",
      content: getAppContent(),
      fileType: "tsx",
    });

    // 2. 添加 main.tsx
    projectBuilder.addFile({
      fileName: "main.tsx",
      filePath: "src/main.tsx",
      content: getMainContent(),
      fileType: "tsx",
    });
  },
};

export default entryPlugin;
