// src/test/setup.ts
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// import * as matchers from "@testing-library/jest-dom/matchers";

// 将 jest-dom 的断言方法扩展到 expect 上
// expect.extend(matchers);

// 在每个测试用例运行后，自动清理 JSDOM 环境
afterEach(() => {
  cleanup();
});
