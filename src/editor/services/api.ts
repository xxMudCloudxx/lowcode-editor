/**
 * @file /src/editor/services/api.ts
 * @description
 * 后端 API 服务封装。
 * 提供页面 CRUD 操作的 HTTP 客户端。
 *
 * @module Services/API
 */

/**
 * 页面数据结构（来自后端）
 */
export interface PageData {
  pageId: string;
  schema: {
    rootId: number;
    components: Record<string, unknown>;
  };
  version: number;
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 获取 API 基础 URL
 */
function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || "http://localhost:8080";
}

/**
 * 创建带认证的 fetch 请求
 */
async function authFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}`,
      errorData.code
    );
  }

  return response;
}

/**
 * 获取页面数据
 * 联机模式下从后端加载 Schema
 *
 * @param pageId 页面 ID
 * @param token JWT Token
 * @returns 页面数据
 */
export async function getPage(
  pageId: string,
  token: string
): Promise<PageData> {
  const response = await authFetch(`${getApiUrl()}/api/pages/${pageId}`, token);
  return response.json();
}

/**
 * 创建页面
 * 将本地 Schema 上传到后端
 *
 * @param schema 组件 Schema
 * @param token JWT Token
 * @returns 创建的页面数据
 */
export async function createPage(
  schema: unknown,
  token: string
): Promise<PageData> {
  const response = await authFetch(`${getApiUrl()}/api/pages`, token, {
    method: "POST",
    body: JSON.stringify({ schema }),
  });
  return response.json();
}

/**
 * 删除页面
 *
 * @param pageId 页面 ID
 * @param token JWT Token
 */
export async function deletePage(pageId: string, token: string): Promise<void> {
  await authFetch(`${getApiUrl()}/api/pages/${pageId}`, token, {
    method: "DELETE",
  });
}
