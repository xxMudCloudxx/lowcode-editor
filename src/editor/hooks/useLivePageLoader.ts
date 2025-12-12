/**
 * @file /src/editor/hooks/useLivePageLoader.ts
 * @description
 * F-05: 联机模式页面数据加载 Hook。
 * 进入联机模式时从 API 加载 Schema，禁用 LocalStorage。
 *
 * @module Hooks/useLivePageLoader
 */

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useComponentsStore } from "../stores/components";
import { useHistoryStore } from "../stores/historyStore";
import { useCollaborationStore } from "../stores/collaborationStore";
import { getPage, ApiError } from "../services/api";

interface UseLivePageLoaderResult {
  isLoading: boolean;
  error: string | null;
}

/**
 * 联机模式页面加载器
 *
 * @param pageId 页面 ID，null 表示本地模式
 * @returns 加载状态
 *
 * @description
 * 工作流程：
 * 1. 检测到 pageId 变化且不为 null
 * 2. 调用 API 获取页面 Schema
 * 3. 使用 applyRemotePatch 方式设置状态（避免记录历史）
 * 4. 清空本地历史栈
 */
export function useLivePageLoader(): UseLivePageLoaderResult {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { setPageLoading, isPageLoading, pageId, editorMode } =
    useCollaborationStore();

  useEffect(() => {
    // 本地模式或无 pageId，不加载
    if (editorMode !== "live" || !pageId) {
      return;
    }

    let cancelled = false;

    const loadPage = async () => {
      setPageLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error("未登录");
        }

        const pageData = await getPage(pageId, token);

        if (cancelled) return;

        // 使用 isApplyingRemotePatch 标志位设置状态，避免记录到历史
        const historyStore = useHistoryStore.getState();
        historyStore.setApplyingRemotePatch(true);

        try {
          // 设置组件数据
          useComponentsStore.setState({
            components: pageData.schema.components as Record<number, any>,
            rootId: pageData.schema.rootId,
          });

          // 清空历史栈（联机模式不使用本地历史）
          historyStore.clear();

          console.log(
            "[LiveLoader] Page loaded:",
            pageId,
            "version:",
            pageData.version
          );
        } finally {
          historyStore.setApplyingRemotePatch(false);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("[LiveLoader] Failed to load page:", err);

        if (err instanceof ApiError) {
          if (err.statusCode === 404) {
            message.error("页面不存在或已被删除");
            navigate("/");
            return;
          }
          if (err.statusCode === 401) {
            message.error("请先登录");
            navigate("/");
            return;
          }
        }

        const errorMessage = err instanceof Error ? err.message : "加载失败";
        setError(errorMessage);
        message.error(`加载页面失败: ${errorMessage}`);
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [pageId, editorMode, getToken, navigate, setPageLoading]);

  return { isLoading: isPageLoading, error };
}
