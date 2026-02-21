// src/code-generator/plugins/project/index-html.ts

import type { IProjectPlugin } from "@lowcode/schema";
import type { ProjectBuilder } from "@lowcode/schema";

/**
 * @file index.html 生成插件
 *
 * @description 职责：
 * 1. 生成一个标准的 Vite 入口 HTML 文件
 * 2. 确保它引用了 /src/main.tsx
 * 3. 将文件添加到 projectBuilder 的根目录
 */
const indexHtmlPlugin: IProjectPlugin = {
  type: "project",
  name: "index-html",

  run: (projectBuilder: ProjectBuilder) => {
    const htmlContent = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lowcode Generated Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

    projectBuilder.addFile({
      fileName: "index.html",
      filePath: "index.html", // 放在项目根目录
      content: htmlContent.trim(),
      fileType: "html",
    });
  },
};

export default indexHtmlPlugin;
