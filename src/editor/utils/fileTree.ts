// src/code-generator/utils/fileTree.ts

import type { TreeDataNode } from "antd";
import React from "react";

//  图标导入
import {
  VscFolder,
  VscFile,
  VscFileCode,
  VscJson,
  VscMarkdown,
} from "react-icons/vsc";
import { SiVite, SiTypescript } from "react-icons/si";
import { FaReact, FaSass, FaHtml5, FaGitAlt } from "react-icons/fa";
import { DiJavascript } from "react-icons/di";
import type { IGeneratedFile } from "../../code-generator/types/ir";

//  getNodeIcon 辅助函数
function getNodeIcon(
  fileName: string,
  fileType: IGeneratedFile["fileType"] | "folder"
): React.ReactNode {
  if (fileType === "folder") {
    return React.createElement(VscFolder);
  }
  if (fileName === "package.json") {
    return React.createElement(VscJson, { color: "#E0A000" });
  }
  if (fileName.startsWith("vite.config")) {
    return React.createElement(SiVite, { color: "#646CFF" });
  }
  if (fileName.endsWith(".tsx")) {
    return React.createElement(FaReact, { color: "#61DAFB" });
  }
  if (fileName.endsWith(".ts")) {
    return React.createElement(SiTypescript, { color: "#3178C6" });
  }
  if (fileName.endsWith(".js")) {
    return React.createElement(DiJavascript, { color: "#F7DF1E" });
  }
  if (fileName.endsWith(".scss") || fileName.endsWith(".sass")) {
    return React.createElement(FaSass, { color: "#C6538C" });
  }
  if (fileName === ".gitignore") {
    return React.createElement(FaGitAlt, { color: "#F05033" });
  }
  switch (fileType) {
    case "tsx":
      return React.createElement(FaReact, { color: "#61DAFB" });
    case "ts":
      return React.createElement(SiTypescript, { color: "#3178C6" });
    case "js":
      return React.createElement(VscFileCode);
    case "json":
      return React.createElement(VscJson, { color: "#E0A000" });
    case "css":
    case "scss":
    case "less":
      return React.createElement(FaSass, { color: "#C6538C" });
    case "html":
      return React.createElement(FaHtml5, { color: "#E34F26" });
    case "md":
      return React.createElement(VscMarkdown);
    case "other":
      return React.createElement(VscFile);
    default:
      return React.createElement(VscFile);
  }
}

// FileTreeNode 接口
interface FileTreeNode extends TreeDataNode {
  key: string;
  isLeaf: boolean;
  fileData?: IGeneratedFile;
  children?: FileTreeNode[];
  icon?: React.ReactNode;
}

/**
 *  递归排序函数
 * - 文件夹 (isLeaf: false) 优先
 * - 然后按字母顺序排序
 */
function sortTreeNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  // 使用 sort 进行排序
  nodes.sort((a, b) => {
    // 规则 1: a 是文件夹, b 是文件 -> a 排前面 (-1)
    if (!a.isLeaf && b.isLeaf) {
      return -1;
    }
    // 规则 2: a 是文件, b 是文件夹 -> a 排后面 (1)
    if (a.isLeaf && !b.isLeaf) {
      return 1;
    }
    // 规则 3: 都是文件或都是文件夹 -> 按字母顺序排
    return (a.title as string).localeCompare(b.title as string);
  });

  // 递归排序所有子文件夹
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      // 对子节点的 children 数组也执行相同的排序
      node.children = sortTreeNodes(node.children);
    }
  }

  return nodes;
}

/**
 *  buildFileTree 函数
 * - 移除了不必要的初始排序
 * - 在函数末尾添加了对 sortTreeNodes 的调用
 */
export function buildFileTree(files: IGeneratedFile[]): FileTreeNode[] {
  const root: FileTreeNode = {
    key: "root",
    title: "root",
    isLeaf: false,
    children: [],
  };
  const nodeMap = new Map<string, FileTreeNode>();
  nodeMap.set("root", root);

  // 之前的 sortedFiles 在这里被移除了，我们最后再统一排序

  for (const file of files) {
    // <--- 使用原始 files 列表
    const parts = file.filePath.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let node = nodeMap.get(currentPath);

      if (!node) {
        const nodeIcon = isLeaf
          ? getNodeIcon(file.fileName, file.fileType)
          : getNodeIcon(part, "folder");

        node = {
          key: currentPath,
          title: part,
          isLeaf: isLeaf,
          icon: nodeIcon,
          children: isLeaf ? undefined : [],
          fileData: isLeaf ? file : undefined,
        };
        nodeMap.set(currentPath, node);

        // 确保 children 数组存在
        if (!currentLevel.children) {
          currentLevel.children = [];
        }
        currentLevel.children.push(node);
      }

      if (!isLeaf) {
        currentLevel = node;
      }
    }
  }

  // 在返回之前，调用我们新的排序函数
  return sortTreeNodes(root.children || []);
}

//  getFileLanguage 保持不变
export function getFileLanguage(fileType: IGeneratedFile["fileType"]): string {
  switch (fileType) {
    case "tsx":
    case "ts":
      return "typescript";
    case "js":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "less":
      return "less";
    case "html":
      return "html";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}
