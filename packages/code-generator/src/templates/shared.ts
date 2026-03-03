/**
 * @file 共享模板文件（框架无关）
 * @description 提取 tsconfig.node.json 和 .gitignore 等完全相同的静态文件，
 *              供各框架模板复用。
 */

import type { IGeneratedFile } from "@lowcode/schema";

/**
 * 生成 tsconfig.node.json（各框架完全一致）
 */
export function getTsconfigNodeJson(): IGeneratedFile {
  return {
    fileName: "tsconfig.node.json",
    filePath: "tsconfig.node.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: "ESNext",
          moduleResolution: "bundler",
          allowSyntheticDefaultImports: true,
        },
        include: ["vite.config.ts"],
      },
      null,
      2,
    ),
    fileType: "json",
  };
}

/**
 * 生成 .gitignore（各框架通用）
 */
export function getGitignore(): IGeneratedFile {
  return {
    fileName: ".gitignore",
    filePath: ".gitignore",
    content: `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

node_modules/
dist/
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# TypeScript cache
*.tsbuildinfo
`,
    fileType: "other",
  };
}
