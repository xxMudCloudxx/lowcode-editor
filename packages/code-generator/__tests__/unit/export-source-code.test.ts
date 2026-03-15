import { describe, expect, it } from "vitest";
import { exportSourceCode } from "../../src/index";
import { createMaterialPack, createDescriptor } from "../helpers/factory";

describe("exportSourceCode", () => {
  it("should generate callable handlers for multi-action events and customJs", async () => {
    const materialPack = createMaterialPack({
      descriptors: [
        createDescriptor({
          name: "Page",
          dependency: { package: "", destructuring: false },
          isContainer: true,
        }),
        createDescriptor({
          name: "Container",
          dependency: { package: "", destructuring: false },
          tagName: "div",
          isContainer: true,
        }),
        createDescriptor({
          name: "Button",
          dependency: {
            package: "antd",
            version: "^5.0.0",
            destructuring: true,
            exportName: "Button",
          },
          propTransforms: {
            rename: { text: "children" },
          },
        }),
        createDescriptor({
          name: "Modal",
          dependency: {
            package: "antd",
            version: "^5.0.0",
            destructuring: true,
            exportName: "Modal",
          },
          propTransforms: {
            filter: ["visibleInEditor"],
          },
          methods: [
            {
              name: "open",
              stateBinding: { prop: "open", value: true },
            },
            {
              name: "close",
              stateBinding: { prop: "open", value: false },
              eventBinding: "onCancel",
            },
            {
              name: "handleOk",
              stateBinding: { prop: "open", value: false },
              eventBinding: "onOk",
            },
          ],
        }),
      ],
    });

    const schema = [
      {
        id: 1,
        name: "Page",
        props: {},
        children: [
          {
            id: 1773502461285,
            name: "Container",
            props: {},
            children: [
              {
                id: 1773502462021,
                name: "Button",
                props: {
                  type: "dashed",
                  size: "large",
                  ghost: false,
                  loading: false,
                  text: "按钮",
                  onClick: {
                    actions: [
                      {
                        type: "componentMethod",
                        config: {
                          componentId: 1773502464194,
                          method: "open",
                          args: {},
                        },
                      },
                      {
                        type: "customJs",
                        code: 'ShowMessage("aaa")\nconsole.log(context.name)\n',
                      },
                      {
                        type: "showMessage",
                        config: {
                          type: "success",
                          text: "done",
                        },
                      },
                      {
                        type: "goToLink",
                        config: {
                          url: "https://example.com",
                          target: "_self",
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          {
            id: 1773502464194,
            name: "Modal",
            props: {
              title: "弹窗",
              visibleInEditor: true,
            },
          },
        ],
      },
    ];

    const result = await exportSourceCode(schema, {
      solution: "react-vite",
      materialPack,
      skipPublisher: true,
    });

    expect(result.success).toBe(true);

    const indexFile = result.files?.find(
      (file) => file.filePath === "src/pages/Index/Index.tsx",
    );

    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain("onClick={handleOnClick");
    expect(indexFile?.content).not.toContain("onClick={[");
    expect(indexFile?.content).toContain("handleOpen_1773502464194();");
    expect(indexFile?.content).toContain(
      "import { runAction } from '../../runtime/actions';",
    );
    expect(indexFile?.content).toContain("runAction(");
    expect(indexFile?.content).toContain("'customJs'");
    expect(indexFile?.content).toContain("'showMessage'");
    expect(indexFile?.content).toContain("'goToLink'");
    expect(indexFile?.content).toContain("props: { type: 'dashed'");
    expect(indexFile?.content).toContain("args");

    const runtimeFile = result.files?.find(
      (file) => file.filePath === "src/runtime/actions.ts",
    );
    expect(runtimeFile).toBeDefined();
    expect(runtimeFile?.content).toContain("const actionRegistry");
    expect(runtimeFile?.content).toContain("export function runAction");
    expect(runtimeFile?.content).toContain("export function runCustomJs");
    expect(runtimeFile?.content).toContain("export function runShowMessage");
    expect(runtimeFile?.content).toContain("export function runGoToLink");
    expect(runtimeFile?.content).toContain(
      "new Function('ShowMessage', 'context', 'args', code)",
    );
  });

  it("should inject only used runtime actions", async () => {
    const materialPack = createMaterialPack({
      descriptors: [
        createDescriptor({
          name: "Page",
          dependency: { package: "", destructuring: false },
          isContainer: true,
        }),
        createDescriptor({
          name: "Button",
          dependency: {
            package: "antd",
            version: "^5.0.0",
            destructuring: true,
            exportName: "Button",
          },
          propTransforms: {
            rename: { text: "children" },
          },
        }),
      ],
    });

    const schema = [
      {
        id: 1,
        name: "Page",
        props: {},
        children: [
          {
            id: 2,
            name: "Button",
            props: {
              text: "按钮",
              onClick: {
                actions: [
                  {
                    type: "showMessage",
                    config: {
                      type: "success",
                      text: "only-message",
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ];

    const result = await exportSourceCode(schema, {
      solution: "react-vite",
      materialPack,
      skipPublisher: true,
    });

    expect(result.success).toBe(true);

    const runtimeFile = result.files?.find(
      (file) => file.filePath === "src/runtime/actions.ts",
    );
    expect(runtimeFile).toBeDefined();
    expect(runtimeFile?.content).toContain("export type RuntimeActionName = 'showMessage';");
    expect(runtimeFile?.content).toContain("export function runShowMessage");
    expect(runtimeFile?.content).not.toContain("export function runCustomJs");
    expect(runtimeFile?.content).not.toContain("export function runGoToLink");
    expect(runtimeFile?.content).not.toContain("customJs:");
    expect(runtimeFile?.content).not.toContain("goToLink:");
  });

  it("should keep the Page root component in generated jsx", async () => {
    const materialPack = createMaterialPack({
      descriptors: [
        createDescriptor({
          name: "Page",
          dependency: {
            package: "./components/Page",
            destructuring: false,
          },
          isContainer: true,
        }),
        createDescriptor({
          name: "Button",
          dependency: {
            package: "antd",
            version: "^5.0.0",
            destructuring: true,
            exportName: "Button",
          },
          propTransforms: {
            rename: { text: "children" },
          },
        }),
      ],
    });

    const schema = [
      {
        id: 1,
        name: "Page",
        props: {
          className: "root-page",
        },
        children: [
          {
            id: 2,
            name: "Button",
            props: {
              text: "按钮",
            },
          },
        ],
      },
    ];

    const result = await exportSourceCode(schema, {
      solution: "react-vite",
      materialPack,
      skipPublisher: true,
    });

    expect(result.success).toBe(true);

    const indexFile = result.files?.find(
      (file) => file.filePath === "src/pages/Index/Index.tsx",
    );

    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain(
      "import Page from '../../components/Page';",
    );
    expect(indexFile?.content).toContain("<Page className={`root-page`}>");
    expect(indexFile?.content).toContain("</Page>");
    expect(indexFile?.content).not.toContain("<>");
  });
});
