import { describe, it, expect, beforeEach } from "vitest";
import { CodeGenRegistry } from "../../../src/registry/codegen-registry";
import { createDescriptor, createDependency } from "../../helpers/factory";
import type { ICodeGenDescriptor } from "@lowcode/schema";

let registry: CodeGenRegistry;

beforeEach(() => {
  registry = new CodeGenRegistry();
});

// ============================================================
// registerDescriptors + has
// ============================================================
describe("CodeGenRegistry — registration", () => {
  it("should register descriptors and detect them via has()", () => {
    registry.registerDescriptors([createDescriptor({ name: "Button" })]);

    expect(registry.has("Button")).toBe(true);
    expect(registry.has("UnknownWidget")).toBe(false);
  });

  it("should register multiple descriptors at once", () => {
    registry.registerDescriptors([
      createDescriptor({ name: "Button" }),
      createDescriptor({ name: "Input" }),
      createDescriptor({ name: "Select" }),
    ]);

    expect(registry.has("Button")).toBe(true);
    expect(registry.has("Input")).toBe(true);
    expect(registry.has("Select")).toBe(true);
  });
});

// ============================================================
// getMetadata
// ============================================================
describe("CodeGenRegistry — getMetadata", () => {
  it("should return undefined for unregistered component", () => {
    expect(registry.getMetadata("Ghost")).toBeUndefined();
  });

  it("should return resolved metadata with correct componentName", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Grid",
        tagName: "Row",
        dependency: createDependency({ exportName: "Row" }),
      }),
    ]);

    const meta = registry.getMetadata("Grid");
    expect(meta).toBeDefined();
    expect(meta!.componentName).toBe("Row");
  });

  it("should return isContainer from descriptor", () => {
    registry.registerDescriptors([
      createDescriptor({ name: "Container", isContainer: true }),
    ]);

    const meta = registry.getMetadata("Container");
    expect(meta!.isContainer).toBe(true);
  });

  it("should return methods from descriptor", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Modal",
        methods: [
          {
            name: "open",
            stateBinding: { prop: "visible", value: true },
          },
        ],
      }),
    ]);

    const meta = registry.getMetadata("Modal");
    expect(meta!.methods).toHaveLength(1);
    expect(meta!.methods![0].name).toBe("open");
  });
});

// ============================================================
// resolve — 优先级: customLogic > descriptor > defaultMeta
// ============================================================
describe("CodeGenRegistry — resolve priority", () => {
  it("should return defaultMeta for unregistered component", () => {
    const meta = registry.resolve("Ghost");
    // defaultMeta 的 getTagName 返回组件原名
    expect(meta.getTagName({})).toBe("Ghost");
  });

  it("should return descriptor-based meta when registered", () => {
    registry.registerDescriptors([
      createDescriptor({ name: "Grid", tagName: "Row" }),
    ]);

    const meta = registry.resolve("Grid");
    expect(meta.getTagName({})).toBe("Row");
  });

  it("should prioritize customLogic over descriptor", () => {
    registry.registerDescriptors([
      createDescriptor({ name: "Icon", tagName: "Icon" }),
    ]);

    registry.registerCustomLogic("Icon", {
      getTagName: () => "CustomIcon",
      getTransformedProps: (p) => ({}),
    });

    const meta = registry.resolve("Icon");
    expect(meta.getTagName({})).toBe("CustomIcon");
  });
});

// ============================================================
// getAllDependencies
// ============================================================
describe("CodeGenRegistry — getAllDependencies", () => {
  it("should return empty object when no descriptors registered", () => {
    expect(registry.getAllDependencies()).toEqual({});
  });

  it("should aggregate dependencies from all descriptors", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Button",
        dependency: createDependency({
          package: "antd",
          version: "^5.0.0",
        }),
      }),
      createDescriptor({
        name: "Icon",
        dependency: createDependency({
          package: "antd",
          version: "^5.0.0",
        }),
        peerDependencies: [{ package: "@ant-design/icons", version: "^5.0.0" }],
      }),
    ]);

    const deps = registry.getAllDependencies();
    expect(deps["antd"]).toBe("^5.0.0");
    expect(deps["@ant-design/icons"]).toBe("^5.0.0");
  });

  it("should skip descriptors with empty package name", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Page",
        dependency: { package: "", destructuring: false },
      }),
    ]);

    const deps = registry.getAllDependencies();
    // 空 package 应不出现在依赖中
    expect(Object.keys(deps).length).toBe(0);
  });
});

// ============================================================
// interpretDescriptor — tagName mapping
// ============================================================
describe("CodeGenRegistry — tagName interpretation", () => {
  it("should handle static string tagName", () => {
    registry.registerDescriptors([
      createDescriptor({ name: "Grid", tagName: "Row" }),
    ]);

    const meta = registry.resolve("Grid");
    expect(meta.getTagName({})).toBe("Row");
  });

  it("should handle ITagNameMapping with prop-based lookup", () => {
    const descriptor: ICodeGenDescriptor = {
      name: "Typography",
      dependency: createDependency(),
      tagName: {
        prop: "type",
        map: {
          Text: "Typography.Text",
          Title: "Typography.Title",
        },
        default: "Typography.Text",
      },
    };
    registry.registerDescriptors([descriptor]);

    const meta = registry.resolve("Typography");
    expect(meta.getTagName({ type: "Title" })).toBe("Typography.Title");
    expect(meta.getTagName({ type: "Text" })).toBe("Typography.Text");
    // 不在 map 中的值应走 default
    expect(meta.getTagName({ type: "Unknown" })).toBe("Typography.Text");
    // 未提供该 prop 时也走 default
    expect(meta.getTagName({})).toBe("Typography.Text");
  });

  it("should fallback to exportName or name when tagName is undefined", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Select",
        dependency: createDependency({ exportName: "Select" }),
      }),
    ]);

    const meta = registry.resolve("Select");
    expect(meta.getTagName({})).toBe("Select");
  });
});

// ============================================================
// buildGetTransformedProps — filter + rename
// ============================================================
describe("CodeGenRegistry — prop transforms", () => {
  it("should filter out specified props", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Button",
        propTransforms: {
          filter: ["visibleInEditor", "desc"],
        },
      }),
    ]);

    const meta = registry.resolve("Button");
    const result = meta.getTransformedProps({
      text: "Click",
      visibleInEditor: true,
      desc: "button desc",
    });

    expect(result).not.toHaveProperty("visibleInEditor");
    expect(result).not.toHaveProperty("desc");
    expect(result).toHaveProperty("text");
  });

  it("should rename props according to rename map", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Button",
        propTransforms: {
          rename: { text: "children" },
        },
      }),
    ]);

    const meta = registry.resolve("Button");
    const result = meta.getTransformedProps({ text: "Click Me" });

    expect(result).toHaveProperty("children");
    expect(result).not.toHaveProperty("text");
  });

  it("should filter tagNameProp", () => {
    registry.registerDescriptors([
      createDescriptor({
        name: "Typography",
        tagName: {
          prop: "type",
          map: { Text: "Typography.Text" },
          default: "Typography.Text",
        },
        propTransforms: {
          tagNameProp: "type",
        },
      }),
    ]);

    const meta = registry.resolve("Typography");
    const result = meta.getTransformedProps({
      type: "Text",
      content: "hello",
    });

    expect(result).not.toHaveProperty("type");
    expect(result).toHaveProperty("content");
  });

  it("should convert raw values to IRPropValue format", () => {
    registry.registerDescriptors([createDescriptor({ name: "Button" })]);

    const meta = registry.resolve("Button");
    const result = meta.getTransformedProps({
      title: "Hello",
      count: 42,
      disabled: false,
    });

    // 每个值应被包装为 { type: "Literal", value: ... }
    expect(result.title).toEqual({ type: "Literal", value: "Hello" });
    expect(result.count).toEqual({ type: "Literal", value: 42 });
    expect(result.disabled).toEqual({ type: "Literal", value: false });
  });
});

// ============================================================
// defaultMeta (通过 resolve 未注册组件间接测试)
// ============================================================
describe("CodeGenRegistry — defaultMeta (via resolve)", () => {
  it("should return meta that echoes the component name as tagName", () => {
    const meta = registry.resolve("MyCustomComp");
    expect(meta.getTagName({})).toBe("MyCustomComp");
  });

  it("should return meta that converts all props to IR format", () => {
    const meta = registry.resolve("MyCustomComp");
    const result = meta.getTransformedProps({ x: 1, y: "two" });

    expect(result.x).toEqual({ type: "Literal", value: 1 });
    expect(result.y).toEqual({ type: "Literal", value: "two" });
  });
});
