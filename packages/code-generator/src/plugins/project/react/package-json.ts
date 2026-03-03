/**
 * @file React package.json 生成插件
 * @description 合并依赖并生成适用于 React 18 + Vite 5 项目的 package.json。
 */

import { createPackageJsonPlugin } from "../shared/package-json";

const packageJsonPlugin = createPackageJsonPlugin({
  pluginName: "package-json",
  projectName: "lowcode-generated-project",
  coreDependencies: {
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.0",
    "@vitejs/plugin-react": "^4.2.1",
    typescript: "^5.2.2",
    vite: "^5.2.0",
    sass: "^1.77.0",
  },
  coreDevDependencies: {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    eslint: "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
  },
  scripts: {
    dev: "vite",
    build: "tsc && vite build",
    lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    preview: "vite preview",
  },
});

export default packageJsonPlugin;
