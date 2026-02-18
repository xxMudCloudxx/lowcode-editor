/**
 * @file materials/__tests__/protocol.test.ts
 * @description 物料协议合规性测试
 *
 * 验证所有物料组件符合 ComponentProtocol 规范：
 * 1. 必须字段存在
 * 2. component 和 editor 字段正确
 * 3. parentTypes 配置正确
 */

import { describe, it, expect } from "vitest";
import { materials } from "../index";

import type { ComponentProtocol } from "@lowcode/schema";

describe("物料协议合规性测试", () => {
  describe("基础字段检查", () => {
    it("所有物料都有 name 和 desc 字段", () => {
      materials.forEach((material) => {
        expect(material.name).toBeDefined();
        expect(typeof material.name).toBe("string");
        expect(material.name.length).toBeGreaterThan(0);

        expect(material.desc).toBeDefined();
        expect(typeof material.desc).toBe("string");
      });
    });

    it("所有物料都有 defaultProps 字段", () => {
      materials.forEach((material) => {
        expect(material.defaultProps).toBeDefined();
        expect(typeof material.defaultProps).toBe("object");
      });
    });
  });

  describe("协议格式验证", () => {
    it("所有组件必须有 component 和 editor 字段", () => {
      materials.forEach((material) => {
        const protocol = material as ComponentProtocol;
        expect(protocol.component).toBeDefined();
        expect(protocol.editor).toBeDefined();
        expect(typeof protocol.editor.isContainer).toBe("boolean");
      });
    });
  });

  describe("parentTypes 配置", () => {
    it("所有非根组件都应配置 parentTypes", () => {
      materials.forEach((material) => {
        // Page 是根组件，不需要 parentTypes
        if (material.name === "Page") return;

        expect(material.editor.parentTypes).toBeDefined();
        expect(Array.isArray(material.editor.parentTypes)).toBe(true);
        expect(material.editor.parentTypes!.length).toBeGreaterThan(0);
      });
    });

    it("parentTypes 中的组件名都存在于物料列表中", () => {
      const materialNames = new Set(materials.map((m) => m.name));

      materials.forEach((material) => {
        const parentTypes = material.editor.parentTypes;

        if (parentTypes) {
          parentTypes.forEach((parentName) => {
            expect(
              materialNames.has(parentName),
              `组件 "${material.name}" 的 parentTypes 中引用了不存在的组件 "${parentName}"`,
            ).toBe(true);
          });
        }
      });
    });
  });

  describe("组件详细检查", () => {
    it("Button 组件配置正确", () => {
      const button = materials.find((m) => m.name === "Button");
      expect(button).toBeDefined();

      const protocol = button as ComponentProtocol;
      expect(protocol.editor.isContainer).toBe(false);
      expect(protocol.editor.interactiveInEditor).toBe(false);
      expect(protocol.setter).toBeDefined();
      expect(protocol.events).toBeDefined();
    });

    it("Icon 组件配置正确", () => {
      const icon = materials.find((m) => m.name === "Icon");
      expect(icon).toBeDefined();

      const protocol = icon as ComponentProtocol;
      expect(protocol.editor.isContainer).toBe(false);
      expect(protocol.setter).toBeDefined();
    });

    it("Typography 组件配置正确", () => {
      const typography = materials.find((m) => m.name === "Typography");
      expect(typography).toBeDefined();

      const protocol = typography as ComponentProtocol;
      expect(protocol.editor.isContainer).toBe(false);
      expect(protocol.setter).toBeDefined();
    });
  });
});
