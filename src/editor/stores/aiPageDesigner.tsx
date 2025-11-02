/**
 * @file /src/editor/stores/aiPageDesigner.tsx
 * @description
 * 使用 Zustand (immer) 管理 AI 页面生成器 (AIPageDesigner) 的全局状态。
 * 这个 store 独立于 useComponetsStore，用于管理模态框 UI 状态和异步生成任务的状态，
 * 避免 UI 状态（如 isLoading）污染 useComponetsStore 的 `temporal` 历史栈。
 * @module Stores/AIPageDesigner
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Component } from "./components"; // 导入我们的核心 Schema 接口

/**
 * @typedef {'idle' | 'loading' | 'success' | 'error'} AiTaskStatus
 * @description AI 任务的运行状态:（空闲、加载中、成功、失败）
 */
type AiTaskStatus = "idle" | "loading" | "success" | "error";

/**
 * @interface State
 * @description 定义 AI 页面生成器 store 的 state 结构。
 */
interface State {
  isModalOpen: boolean; // 模态框是否可见
  status: AiTaskStatus; // 当前 AI 任务状态
  prompt: string; // 用户输入的文本提示
  imageUrl: string | null; // 用户上传的图片 URL (base64)
  generatedSchema: Component[] | null; // AI 成功生成的页面 Schema
  errorMessage: string | null; // 任务失败时的错误信息
}

/**
 * @interface Action
 * @description 定义了所有可以修改 state 的 actions。
 */
interface Action {
  /**
   * @description 打开模态框。
   */
  openModal: () => void;

  /**
   * @description 关闭模态框。
   */
  closeModal: () => void;

  /**
   * @description 更新用户输入的文本提示。
   * @param {string} prompt - 文本提示。
   */
  setPrompt: (prompt: string) => void;

  /**
   * @description 更新用户上传的图片 URL。
   * @param {string | null} url - 图片的 base64 或 URL。
   */
  setImageUrl: (url: string | null) => void;

  /**
   * @description 核心异步 action：开始执行 AI 生成任务。
   * 负责设置加载状态、调用 API、处理成功/失败回调。
   * @param {string} userPrompt - 本次任务的文本提示。
   * @param {string | null} userImage - 本次任务的图片。
   */
  startGeneration: (
    userPrompt: string,
    userImage: string | null
  ) => Promise<void>;

  /**
   * @description 重置任务状态（用于“重新生成”或“重试”）。
   * 保留用户输入，但清除上次的结果和错误。
   */
  reset: () => void;

  /**
   * @description 用户点击“应用”后，重置整个 store 到初始状态。
   */
  applyAndClose: () => void;
}

// store 的初始状态
const initialState: State = {
  isModalOpen: false,
  status: "idle",
  prompt: "",
  imageUrl: null,
  generatedSchema: null,
  errorMessage: null,
};

/**
 * @description
 * AI 页面生成器的全局 Zustand store 实例。
 */
export const useAiPageDesignerStore = create(
  immer<State & Action>((set) => ({
    ...initialState,

    // --- Actions ---

    openModal: () => {
      set((state) => {
        state.isModalOpen = true;
      });
    },

    closeModal: () => {
      set((state) => {
        state.isModalOpen = false;
      });
    },

    setPrompt: (prompt) => {
      set((state) => {
        state.prompt = prompt;
      });
    },

    setImageUrl: (url) => {
      set((state) => {
        state.imageUrl = url;
      });
    },

    startGeneration: async (userPrompt, userImage) => {
      // 1. 立即设置加载状态 (这会立刻更新 Header 按钮的样式)
      set((state) => {
        state.status = "loading";
        state.prompt = userPrompt; // 保存用户输入
        state.imageUrl = userImage;
        state.generatedSchema = null;
        state.errorMessage = null;
        state.isModalOpen = true; // 确保模态框打开以显示进度
      });

      try {
        // 2. 调用我们的后端 Serverless API
        const response = await fetch("/api/generate-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: userPrompt,
            image: userImage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "AI 生成失败");
        }

        const generatedSchema = (await response.json()) as Component[];

        // 3. 设置成功状态和结果
        set((state) => {
          state.status = "success";
          state.generatedSchema = generatedSchema;
        });
      } catch (error) {
        // 4. 设置失败状态
        set((state) => {
          state.status = "error";
          state.errorMessage = (error as Error).message;
        });
      }
    },

    reset: () => {
      set((state) => {
        state.status = "idle";
        state.generatedSchema = null;
        state.errorMessage = null;
        // 保持 prompt 和 imageUrl，方便用户编辑
      });
    },

    applyAndClose: () => {
      // 重置为初始状态
      set(initialState);
    },
  }))
);
