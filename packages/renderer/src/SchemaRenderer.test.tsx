import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentConfig } from "@lowcode/schema";
import { SchemaRenderer } from "./SchemaRenderer";

const TextComponent = ({ text }: { text?: string }) => <div>{text}</div>;

const componentMap: Record<string, ComponentConfig> = {
  Text: {
    name: "Text",
    desc: "Text",
    component: TextComponent,
    defaultProps: {},
    editor: {},
  },
};

describe("SchemaRenderer expression integration", () => {
  it("resolves expression props in live mode", () => {
    const markup = renderToStaticMarkup(
      <SchemaRenderer
        components={{
          1: {
            id: 1,
            name: "Text",
            desc: "text",
            props: {
              text: { type: "JSExpression", value: "$page.title" },
            },
            children: [],
          },
        }}
        rootId={1}
        componentMap={componentMap}
        designMode="live"
        expressionContext={{
          $global: {},
          $page: { title: "Hello renderer" },
          $data: {},
          $props: {},
          $system: {},
        }}
      />,
    );

    expect(markup).toContain("Hello renderer");
  });

  it("reflects new context values on subsequent renders", () => {
    const firstMarkup = renderToStaticMarkup(
      <SchemaRenderer
        components={{
          1: {
            id: 1,
            name: "Text",
            desc: "text",
            props: {
              text: { type: "JSExpression", value: "$page.count + ' clicks'" },
            },
            children: [],
          },
        }}
        rootId={1}
        componentMap={componentMap}
        designMode="live"
        expressionContext={{
          $global: {},
          $page: { count: 1 },
          $data: {},
          $props: {},
          $system: {},
        }}
      />,
    );

    const secondMarkup = renderToStaticMarkup(
      <SchemaRenderer
        components={{
          1: {
            id: 1,
            name: "Text",
            desc: "text",
            props: {
              text: { type: "JSExpression", value: "$page.count + ' clicks'" },
            },
            children: [],
          },
        }}
        rootId={1}
        componentMap={componentMap}
        designMode="live"
        expressionContext={{
          $global: {},
          $page: { count: 5 },
          $data: {},
          $props: {},
          $system: {},
        }}
      />,
    );

    expect(firstMarkup).toContain("1 clicks");
    expect(secondMarkup).toContain("5 clicks");
  });
});
