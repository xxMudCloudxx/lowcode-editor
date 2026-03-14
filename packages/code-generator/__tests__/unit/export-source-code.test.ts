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
    expect(indexFile?.content).toContain("const __runCustomJs = new Function(");
    expect(indexFile?.content).toContain("'ShowMessage',");
    expect(indexFile?.content).toContain("'context',");
    expect(indexFile?.content).toContain("'args',");
    expect(indexFile?.content).toContain("ShowMessage");
    expect(indexFile?.content).toContain("props: { type: 'dashed'");
    expect(indexFile?.content).toContain("args");
  });
});
