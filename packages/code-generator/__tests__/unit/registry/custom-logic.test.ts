import { describe, it, expect, vi } from "vitest";
import {
  iconCustomLogic,
  tableCustomLogic,
  formItemCustomLogic,
} from "../../../../materials/src/custom-logic";
import type { IModuleBuilder } from "@lowcode/schema";

// ============================================================
// iconCustomLogic
// ============================================================
describe("iconCustomLogic", () => {
  describe("getTagName", () => {
    it("should append Outlined suffix for short icon names", () => {
      expect(iconCustomLogic.getTagName({ icon: "smile" })).toBe(
        "smileOutlined",
      );
    });

    it("should not modify names already ending with Outlined", () => {
      expect(iconCustomLogic.getTagName({ icon: "SmileOutlined" })).toBe(
        "SmileOutlined",
      );
    });

    it("should not modify names ending with Filled", () => {
      expect(iconCustomLogic.getTagName({ icon: "HeartFilled" })).toBe(
        "HeartFilled",
      );
    });

    it("should not modify names ending with TwoTone", () => {
      expect(iconCustomLogic.getTagName({ icon: "CheckCircleTwoTone" })).toBe(
        "CheckCircleTwoTone",
      );
    });

    it("should fallback to type prop if icon is absent", () => {
      expect(iconCustomLogic.getTagName({ type: "search" })).toBe(
        "searchOutlined",
      );
    });

    it("should fallback to default if neither icon nor type", () => {
      expect(iconCustomLogic.getTagName({})).toBe("QuestionCircleOutlined");
    });
  });

  describe("getTransformedProps", () => {
    it("should filter out icon, type, id, name, parentId, desc", () => {
      const result = iconCustomLogic.getTransformedProps({
        icon: "smile",
        type: "primary",
        id: 1,
        name: "Icon",
        parentId: 0,
        desc: "test icon",
        style: { color: "red" },
      });

      expect(result).not.toHaveProperty("icon");
      expect(result).not.toHaveProperty("type");
      expect(result).not.toHaveProperty("id");
      expect(result).not.toHaveProperty("name");
      expect(result).not.toHaveProperty("parentId");
      expect(result).not.toHaveProperty("desc");
      expect(result).toHaveProperty("style");
    });

    it("should wrap plain values as Literal", () => {
      const result = iconCustomLogic.getTransformedProps({
        spin: true,
      });

      expect(result.spin).toEqual({ type: "Literal", value: true });
    });

    it("should preserve existing IR-typed objects", () => {
      const expr = { type: "JSExpression", value: "this.state.spin" };
      const result = iconCustomLogic.getTransformedProps({ spin: expr });

      expect(result.spin).toEqual(expr);
    });
  });

  describe("getLogicFragments", () => {
    it("should call moduleBuilder.addImport for non-default icon", () => {
      const mockBuilder: Partial<IModuleBuilder> = {
        addImport: vi.fn(),
      };

      iconCustomLogic.getLogicFragments!(
        { icon: "HeartOutlined" },
        mockBuilder as IModuleBuilder,
      );

      expect(mockBuilder.addImport).toHaveBeenCalledWith(
        expect.objectContaining({
          package: "@ant-design/icons",
          exportName: "HeartOutlined",
        }),
        "HeartOutlined",
      );
    });

    it("should not call addImport for default icon (QuestionCircleOutlined)", () => {
      const mockBuilder: Partial<IModuleBuilder> = {
        addImport: vi.fn(),
      };

      iconCustomLogic.getLogicFragments!(
        { icon: "QuestionCircleOutlined" },
        mockBuilder as IModuleBuilder,
      );

      expect(mockBuilder.addImport).not.toHaveBeenCalled();
    });

    it("should not call addImport when icon is unspecified", () => {
      const mockBuilder: Partial<IModuleBuilder> = {
        addImport: vi.fn(),
      };

      iconCustomLogic.getLogicFragments!({}, mockBuilder as IModuleBuilder);

      expect(mockBuilder.addImport).not.toHaveBeenCalled();
    });
  });
});

// ============================================================
// tableCustomLogic
// ============================================================
describe("tableCustomLogic", () => {
  it("should always return Table as tagName", () => {
    expect(tableCustomLogic.getTagName({})).toBe("Table");
  });

  it("should auto-generate mock dataSource when columns exist but dataSource is absent", () => {
    const columns = [
      { dataIndex: "name", title: "Name" },
      { dataIndex: "age", title: "Age" },
    ];
    const result = tableCustomLogic.getTransformedProps({ columns });

    expect(result.dataSource).toBeDefined();
    const ds = result.dataSource as { type: string; value: any[] };
    expect(ds.type).toBe("Literal");
    expect(ds.value).toHaveLength(1);
    expect(ds.value[0]).toHaveProperty("name", "示例数据");
    expect(ds.value[0]).toHaveProperty("age", "示例数据");
  });

  it("should not override existing dataSource", () => {
    const columns = [{ dataIndex: "name", title: "Name" }];
    const existing = [{ name: "real data" }];
    const result = tableCustomLogic.getTransformedProps({
      columns,
      dataSource: existing,
    });

    // dataSource 应保留用户提供的值，不被覆盖
    const ds = result.dataSource as { type: string; value: any };
    expect(ds.value).toEqual(existing);
  });

  it("should filter out url, id, name, parentId, desc", () => {
    const result = tableCustomLogic.getTransformedProps({
      url: "/api/data",
      id: 1,
      name: "Table",
      parentId: 0,
      desc: "test table",
      bordered: true,
    });

    expect(result).not.toHaveProperty("url");
    expect(result).not.toHaveProperty("id");
    expect(result).toHaveProperty("bordered");
  });
});

// ============================================================
// formItemCustomLogic
// ============================================================
describe("formItemCustomLogic", () => {
  it("should always return Form.Item as tagName", () => {
    expect(formItemCustomLogic.getTagName({})).toBe("Form.Item");
  });

  it("should convert numeric name to string", () => {
    const result = formItemCustomLogic.getTransformedProps({
      name: 123,
      label: "Field",
    });

    expect(result.name).toEqual({ type: "Literal", value: "123" });
  });

  it("should keep string name as-is", () => {
    const result = formItemCustomLogic.getTransformedProps({
      name: "username",
    });

    expect(result.name).toEqual({ type: "Literal", value: "username" });
  });

  it("should filter out id, parentId, desc", () => {
    const result = formItemCustomLogic.getTransformedProps({
      id: 1,
      parentId: 0,
      desc: "test",
      label: "Name",
    });

    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("parentId");
    expect(result).not.toHaveProperty("desc");
    expect(result).toHaveProperty("label");
  });
});
