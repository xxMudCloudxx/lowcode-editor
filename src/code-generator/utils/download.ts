// src/code-generator/utils/download.ts

/**
 * 触发浏览器下载一个 Blob 对象
 * @param blob - 要下载的 Blob
 * @param filename - 下载时显示的文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // 创建一个临时的 URL 指向 Blob
  const url = URL.createObjectURL(blob);

  // 创建一个临时的 <a> 标签用于下载
  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // 设置下载的文件名

  // 将 <a> 标签添加到 DOM 中，模拟点击，然后移除
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // 释放临时的 URL 对象
  URL.revokeObjectURL(url);
}
