// src/test/setup.ts
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
// import * as matchers from "@testing-library/jest-dom/matchers";

// 将 jest-dom 的断言方法扩展到 expect 上
// expect.extend(matchers);

function createMemoryStorage(): Storage {
  let store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map<string, string>();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const localStorageMock = createMemoryStorage();
const sessionStorageMock = createMemoryStorage();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  configurable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
  configurable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// 在每个测试用例运行后，自动清理 JSDOM 环境
afterEach(() => {
  cleanup();
});
