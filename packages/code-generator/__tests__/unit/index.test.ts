import { describe, it, expect } from "vitest";
import {
  registerSolution,
  getRegisteredSolutions,
  resolveSolution,
  sortProjectPlugins,
} from "../../src/index";
import type { ISolution, IProjectPlugin } from "@lowcode/schema";

// ============================================================
// resolveSolution
// ============================================================
describe("resolveSolution", () => {
  it("should resolve built-in 'react-vite' solution by string", () => {
    const solution = resolveSolution("react-vite");
    expect(solution).toBeDefined();
    expect(solution.name).toBe("react-vite");
  });

  it("should resolve built-in 'vue-vite' solution by string", () => {
    const solution = resolveSolution("vue-vite");
    expect(solution).toBeDefined();
    expect(solution.name).toBe("vue-vite");
  });

  it("should default to react-vite when no argument given", () => {
    const solution = resolveSolution();
    expect(solution.name).toBe("react-vite");
  });

  it("should accept an ISolution object directly", () => {
    const custom: ISolution = {
      name: "custom",
      description: "test",
      template: { name: "custom-tpl", getStaticFiles: () => [] },
      componentPlugins: [],
      projectPlugins: [],
      postProcessors: [],
      publisher: { name: "noop", publish: async () => ({ type: "blob" }) },
    } as ISolution;
    const solution = resolveSolution(custom);
    expect(solution).toBe(custom);
  });

  it("should throw for unknown solution string", () => {
    expect(() => resolveSolution("flutter-native")).toThrow();
  });
});

// ============================================================
// registerSolution + getRegisteredSolutions
// ============================================================
describe("registerSolution / getRegisteredSolutions", () => {
  it("should register a custom solution and list it", () => {
    const custom: ISolution = {
      name: "my-solution",
      description: "test",
      template: { name: "my-tpl", getStaticFiles: () => [] },
      componentPlugins: [],
      projectPlugins: [],
      postProcessors: [],
      publisher: { name: "noop", publish: async () => ({ type: "blob" }) },
    } as ISolution;
    registerSolution(custom);

    const names = getRegisteredSolutions();
    expect(names).toContain("my-solution");
  });

  it("should include built-in solutions in the list", () => {
    const names = getRegisteredSolutions();
    expect(names).toContain("react-vite");
    expect(names).toContain("vue-vite");
  });
});

// ============================================================
// sortProjectPlugins
// ============================================================
describe("sortProjectPlugins", () => {
  it("should split plugins into pre and post groups", () => {
    const plugins: IProjectPlugin[] = [
      {
        type: "project",
        name: "a",
        run: async () => {},
        phase: "pre",
        weight: 10,
      },
      {
        type: "project",
        name: "b",
        run: async () => {},
        phase: "post",
        weight: 20,
      },
      {
        type: "project",
        name: "c",
        run: async () => {},
        phase: "pre",
        weight: 5,
      },
    ];

    const sorted = sortProjectPlugins(plugins);

    expect(sorted.pre).toHaveLength(2);
    expect(sorted.post).toHaveLength(1);
  });

  it("should sort each group by weight ascending", () => {
    const plugins: IProjectPlugin[] = [
      {
        type: "project",
        name: "heavy",
        run: async () => {},
        phase: "pre",
        weight: 100,
      },
      {
        type: "project",
        name: "light",
        run: async () => {},
        phase: "pre",
        weight: 1,
      },
      {
        type: "project",
        name: "mid",
        run: async () => {},
        phase: "pre",
        weight: 50,
      },
    ];

    const sorted = sortProjectPlugins(plugins);

    expect(sorted.pre[0].name).toBe("light");
    expect(sorted.pre[1].name).toBe("mid");
    expect(sorted.pre[2].name).toBe("heavy");
  });

  it("should default missing phase to post", () => {
    const plugins: IProjectPlugin[] = [
      {
        type: "project",
        name: "no-phase",
        run: async () => {},
        weight: 10,
      } as any,
    ];

    const sorted = sortProjectPlugins(plugins);

    // 无 phase 应归入 post
    expect(sorted.post).toHaveLength(1);
  });
});
