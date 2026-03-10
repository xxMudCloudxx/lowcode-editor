import { describe, it, expect, beforeEach } from "vitest";
import { SchemaParser } from "../../../src/parser/schema-parser";
import {
  createSchema,
  createSchemaNode,
  createRegistry,
  createDescriptor,
} from "../../helpers/factory";
import type { CodeGenRegistry } from "../../../src/registry/codegen-registry";

let registry: CodeGenRegistry;
let parser: SchemaParser;

beforeEach(() => {
  registry = createRegistry();
  parser = new SchemaParser(registry);
});

// ============================================================
// parse() — 项目级
// ============================================================
describe("SchemaParser.parse", () => {
  it("should return an IRProject with empty pages for empty schema", () => {
    const result = parser.parse([]);
    expect(result.pages).toHaveLength(0);
  });

  it("should parse a schema with a Page root node", () => {
    const schema = createSchema();
    const result = parser.parse(schema);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].fileName).toBe("index");
  });

  it("should fallback to first element if no Page node found", () => {
    const schema = [createSchemaNode({ name: "Container", id: "c1" })];
    // Container 未注册，会走 fallback
    const result = parser.parse(schema);

    expect(result.pages).toHaveLength(1);
  });

  it("should aggregate project dependencies from registry", () => {
    registry = createRegistry([
      createDescriptor({
        name: "Button",
        dependency: {
          package: "antd",
          version: "^5.0.0",
          destructuring: true,
        },
        peerDependencies: [{ package: "@ant-design/icons", version: "^5.0.0" }],
      }),
      createDescriptor({
        name: "Page",
        dependency: { package: "", destructuring: false },
      }),
    ]);
    parser = new SchemaParser(registry);

    const schema = createSchema({}, [
      createSchemaNode({ name: "Button", id: "b1" }),
    ]);
    const result = parser.parse(schema);

    // getAllDependencies 应包含 antd 和 @ant-design/icons
    expect(result.dependencies).toHaveProperty("antd");
  });
});

// ============================================================
// parseNode — 未知组件 fallback
// ============================================================
describe("SchemaParser — unknown component fallback", () => {
  it("should render unknown components as div with data attribute", () => {
    const schema = [
      createSchemaNode({
        name: "Page",
        id: "page_1",
        children: [createSchemaNode({ name: "NonExistentWidget", id: "w1" })],
      }),
    ];
    const result = parser.parse(schema);
    const root = result.pages[0].node;

    // Page 的第一个子节点应该是 fallback div
    expect(root.children).toBeDefined();
    expect(root.children![0].componentName).toBe("div");
    expect(root.children![0].props["data-unknown-component"]).toEqual({
      type: "Literal",
      value: "NonExistentWidget",
    });
  });
});

// ============================================================
// parsePropValue — 属性解析
// ============================================================
describe("SchemaParser — prop value parsing", () => {
  it("should parse string props as Literal", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: { title: "Hello" },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.title).toEqual({ type: "Literal", value: "Hello" });
  });

  it("should parse number props as Literal", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: { count: 42 },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.count).toEqual({ type: "Literal", value: 42 });
  });

  it("should parse boolean props as Literal", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: { disabled: true },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.disabled).toEqual({ type: "Literal", value: true });
  });

  it("should parse null as Literal", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: { value: null },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.value).toEqual({ type: "Literal", value: null });
  });

  it("should parse object props as deep-copied Literal", () => {
    const original = { a: 1, b: { c: 2 } };
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: { data: original },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.data).toEqual({
      type: "Literal",
      value: { a: 1, b: { c: 2 } },
    });
    // 应是深拷贝，非同引用
    expect((btn.props.data as any).value).not.toBe(original);
  });

  it("should parse array props as Literal", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: { items: [1, 2, 3] },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.items).toEqual({
      type: "Literal",
      value: [1, 2, 3],
    });
  });

  it("should parse JSExpression type props", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: {
          visible: { type: "JSExpression", value: "this.state.show" },
        },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.visible).toEqual({
      type: "JSExpression",
      value: "this.state.show",
    });
  });

  it("should parse JSFunction type props", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: {
          formatter: {
            type: "JSFunction",
            value: "(val) => val.toFixed(2)",
          },
        },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.formatter).toEqual({
      type: "JSFunction",
      value: "(val) => val.toFixed(2)",
    });
  });

  it("should parse action props (single action)", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: {
          onClick: {
            actions: [{ type: "navigateTo", config: { url: "/home" } }],
          },
        },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    // 单个 action 应返回单个 IRAction（非数组）
    expect(btn.props.onClick).toEqual({
      type: "Action",
      actionType: "navigateTo",
      config: { url: "/home" },
    });
  });

  it("should parse action props (multiple actions)", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: {
          onClick: {
            actions: [
              { type: "navigateTo", config: { url: "/" } },
              { type: "customJS", config: { code: "alert(1)" } },
            ],
          },
        },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(Array.isArray(btn.props.onClick)).toBe(true);
    expect((btn.props.onClick as any[]).length).toBe(2);
  });

  it("should return Literal null for invalid action structure", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: {
          onClick: {
            actions: [{ invalid: true }], // 不合法
          },
        },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.props.onClick).toEqual({ type: "Literal", value: null });
  });

  it("should degrade invalid JSExpression to Literal", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        props: {
          bad: { type: "JSExpression", value: 12345 }, // value 不是 string
        },
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    // 应降级为 Literal
    expect(btn.props.bad.type).toBe("Literal");
  });
});

// ============================================================
// 递归子节点
// ============================================================
describe("SchemaParser — children recursion", () => {
  it("should recursively parse nested children", () => {
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        children: [createSchemaNode({ name: "Button", id: "b2" })],
      }),
    ]);
    const result = parser.parse(schema);
    const page = result.pages[0];

    expect(page.node.children).toHaveLength(1);
    expect(page.node.children![0].children).toHaveLength(1);
    expect(page.node.children![0].children![0].componentName).toBe("Button");
  });
});

// ============================================================
// styles 透传
// ============================================================
describe("SchemaParser — styles passthrough", () => {
  it("should copy styles from schema to IR node", () => {
    const styles = { color: "red", fontSize: "14px" };
    const schema = createSchema({}, [
      createSchemaNode({
        name: "Button",
        id: "b1",
        styles,
      }),
    ]);
    const result = parser.parse(schema);
    const btn = result.pages[0].node.children![0];

    expect(btn.styles).toEqual(styles);
  });
});
