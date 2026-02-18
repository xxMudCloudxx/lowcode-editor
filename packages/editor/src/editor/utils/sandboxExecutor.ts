/**
 * @file /src/editor/utils/sandboxExecutor.ts
 * @description
 * Iframe 沙盒执行器，用于安全地执行用户自定义 JavaScript 代码。
 * 通过 iframe sandbox 属性隔离代码执行环境，防止恶意代码访问主页面。
 * @module Utils/SandboxExecutor
 */

/**
 * 沙盒上下文接口，定义沙盒内可用的 API
 */
export interface SandboxContext {
  /** 组件名称 */
  name: string;
  /** 组件 props */
  props: Record<string, unknown>;
  /** 显示成功消息的回调 */
  onShowMessage: (content: string) => void;
  /** 事件触发时的原始参数 */
  eventArgs?: unknown[];
}

/**
 * 沙盒消息类型定义
 */
interface SandboxMessage {
  type: "showMessage" | "complete" | "error";
  payload?: unknown;
}

/**
 * 安全序列化对象，过滤掉不可序列化的值（DOM 元素、函数、循环引用等）
 */
function safeSerialize(obj: unknown): string {
  const seen = new WeakSet();

  const replacer = (_key: string, value: unknown): unknown => {
    // 过滤函数
    if (typeof value === "function") {
      return undefined;
    }
    // 过滤 DOM 元素
    if (value instanceof Element || value instanceof Node) {
      return "[DOM Element]";
    }
    // 过滤 React ref 对象
    if (
      value &&
      typeof value === "object" &&
      "current" in value &&
      Object.keys(value).length === 1
    ) {
      return "[Ref]";
    }
    // 检测循环引用
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };

  try {
    return JSON.stringify(obj, replacer);
  } catch {
    return JSON.stringify({ error: "序列化失败" });
  }
}

/**
 * 生成 iframe 内部执行的 HTML 内容
 * @param code 用户自定义代码
 * @param context 上下文数据（序列化为 JSON）
 */
function generateSandboxHTML(
  code: string,
  context: {
    name: string;
    props: Record<string, unknown>;
    eventArgs?: unknown[];
  }
): string {
  const contextJSON = safeSerialize(context);

  // 🔐 安全关键：使用 JSON.stringify 将用户代码转为安全的字符串字面量
  // 这样可以防止模板字符串注入攻击（Template Literal Injection）
  // 例如用户输入 ${alert(1)} 会被转义为 "\${alert(1)}" 而不会执行
  const codeStringLiteral = JSON.stringify(code);

  // 注意：这里使用普通字符串拼接而不是模板字符串来构建 script 内容
  // 因为我们需要在 script 标签内使用变量插值
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
(function() {
  "use strict";

  // 构建沙盒内的 context 对象
  var contextData = ${contextJSON};
  
  // 定义 ShowMessage 函数（可直接调用，无需 context 前缀）
  var ShowMessage = function(content) {
    parent.postMessage({ type: "showMessage", payload: content }, "*");
  };
  
  var context = {
    name: contextData.name,
    props: contextData.props,
    ShowMessage: ShowMessage
  };
  var args = contextData.eventArgs || [];

  try {
    // 🔐 安全：userCode 现在是通过 JSON.stringify 生成的字符串字面量
    // 不再使用模板字符串，防止 \${...} 注入攻击
    var userCode = ${codeStringLiteral};
    
    var fn = new Function("context", "args", "ShowMessage", userCode);
    fn(context, args, ShowMessage);
    
    // 通知主页面执行完成
    parent.postMessage({ type: "complete" }, "*");
  } catch (err) {
    // 通知主页面执行出错
    parent.postMessage({ type: "error", payload: err.message }, "*");
  }
})();
</script>
</body>
</html>
`;
}

/**
 * 在 iframe 沙盒中安全执行用户代码
 *
 * @param code 用户自定义 JavaScript 代码
 * @param context 执行上下文，包含组件信息和回调函数
 * @param timeout 执行超时时间（毫秒），默认 5000ms
 * @returns Promise，执行完成后 resolve
 *
 * @example
 * ```ts
 * await executeSandboxedCode(
 *   'context.ShowMessage("Hello!");',
 *   {
 *     name: "Button",
 *     props: { text: "Click me" },
 *     onShowMessage: (msg) => message.success(msg),
 *   }
 * );
 * ```
 */
export function executeSandboxedCode(
  code: string,
  context: SandboxContext,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 创建隐藏的 iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    // sandbox 属性：只允许脚本执行，禁止访问父页面 DOM、表单提交等
    iframe.sandbox.add("allow-scripts");

    let timeoutId: ReturnType<typeof setTimeout>;
    let resolved = false;

    // 清理函数
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    };

    // 监听来自 iframe 的消息
    const handleMessage = (event: MessageEvent<SandboxMessage>) => {
      // 验证消息来源是我们创建的 iframe
      if (event.source !== iframe.contentWindow) return;

      const { type, payload } = event.data;

      switch (type) {
        case "showMessage":
          // 调用主页面的显示消息函数
          context.onShowMessage(String(payload));
          break;
        case "complete":
          cleanup();
          resolve();
          break;
        case "error":
          cleanup();
          console.error("[Sandbox Error]", payload);
          reject(new Error(String(payload)));
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // 设置超时
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("沙盒代码执行超时"));
    }, timeout);

    // 生成 iframe 内容并加载
    const html = generateSandboxHTML(code, {
      name: context.name,
      props: context.props as Record<string, unknown>,
      eventArgs: context.eventArgs as unknown[],
    });

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}
