/* eslint-disable no-console */
// scripts/gen-antd-metas.ts
import * as fs from "fs";
import * as path from "path";
import { withCustomConfig, PropItem } from "react-docgen-typescript";

/** ========= 目标 antd 组件清单 =========
 * propsType: 从 antd/es 路径直接引入 Props 类型，配合 ComponentProps 双通道解析
 */
type Target = {
  name: string; // 文件名与 meta.name
  importStmt: string; // wrapper 中的 import 语句
  componentExpr: string; // 组件表达式（支持 'Checkbox.Group'）
  desc?: string;
  propsType?: { from: string; typeName: string }; // 直接引 Props 的兜底方式
};

const TARGETS: Target[] = [
  {
    name: "Button",
    importStmt: `import { Button } from 'antd';`,
    componentExpr: "Button",
    desc: "按钮",
    propsType: { from: "antd/es/button", typeName: "ButtonProps" },
  },
  {
    name: "Select",
    importStmt: `import { Select } from 'antd';`,
    componentExpr: "Select",
    desc: "选择器",
    // SelectProps 是泛型，这里用 any 兜底；docgen 仍能抽出枚举与基础字段
    propsType: { from: "antd/es/select", typeName: "SelectProps<any>" },
  },
  {
    name: "CheckboxGroup",
    importStmt: `import { Checkbox } from 'antd';`,
    componentExpr: "Checkbox.Group",
    desc: "多选组",
    propsType: { from: "antd/es/checkbox", typeName: "CheckboxGroupProps" },
  },
  {
    name: "Form",
    importStmt: `import { Form } from 'antd';`,
    componentExpr: "Form",
    desc: "表单",
    propsType: { from: "antd/es/Form", typeName: "FormProps" },
  },
];

const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, "src/editor/materials/_generated");
const TMP_DIR = path.resolve(ROOT, "scripts/.docgen-temp");

const COMPONENT_CONFIG_IMPORT = `import type { ComponentConfig } from '../../stores/component-config';`;

/** ========= FS 小工具 ========= */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function clearDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  }
}
function write(file: string, content: string) {
  fs.writeFileSync(file, content.replace(/\r\n/g, "\n"));
}
function toPascalCase(s: string) {
  return s.replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase());
}
const QUOTE_TRIM = /^['"`]|['"`]$/g;

/** ========= 类型辅助 ========= */
type DocType = { name?: string; raw?: string; value?: unknown };

/** ========= 联合/枚举提取成选项 ========= */
function extractLiteralOptions(t?: DocType): string[] {
  if (!t) return [];
  const out: string[] = [];

  const v = t.value as unknown;
  if (Array.isArray(v)) {
    for (const item of v as Array<{ value?: unknown; name?: unknown }>) {
      const s = String(item?.value ?? item?.name ?? "").trim();
      if (s) out.push(s.replace(QUOTE_TRIM, "").replace(QUOTE_TRIM, ""));
    }
  }

  const raw = (t.raw ?? "").toString();
  if (raw && /'[^']*'\s*\|/.test(raw)) {
    raw
      .split("|")
      .map((s) => s.trim().replace(QUOTE_TRIM, ""))
      .filter(Boolean)
      .forEach((s) => out.push(s));
  }
  return Array.from(new Set(out)); // string[]
}

function lower(t?: DocType): string {
  const n = (t?.name ?? t?.raw ?? "").toString();
  return n.toLowerCase();
}

/** ========= 控件映射 ========= */
function guessControlByType(
  propName: string,
  t?: DocType
): { control: string; options?: string[] } {
  const options = extractLiteralOptions(t);
  if (options.length > 0) {
    return { control: "select", options };
  }
  const tn = lower(t);
  if (tn.includes("boolean")) return { control: "switch" };
  if (tn.includes("number") || tn.includes("bigint") || tn.includes("integer"))
    return { control: "inputNumber" };
  return { control: "input" };
}

/** ========= 过滤不展示的属性 ========= */
function shouldDropProp(propName: string, typeNameLower: string) {
  if (propName === "children") return false; // 文本/插槽通常保留
  if (/^on[A-Z]/.test(propName)) return true; // 事件统一放到 events
  const blacklist = new Set([
    "style",
    "className",
    "prefixCls",
    "rootClassName",
    "rootStyle",
    "key",
    "ref",
    "__PRIVATE_",
  ]);
  if (blacklist.has(propName)) return true;
  if (typeNameLower.includes("=>")) return true; // 函数签名不做 setter
  return false;
}

/** ========= 常见字段中文 label ========= */
const FRIENDLY_LABEL: Record<string, string> = {
  type: "按钮类型",
  htmlType: "原生类型",
  size: "尺寸",
  danger: "危险态",
  ghost: "幽灵",
  block: "块级",
  loading: "加载",
  href: "链接",
  target: "打开方式",
  children: "文本",
};

/** ========= 兜底：当 docgen 拿不到任何 props 时的 Button 配置 ========= */
const FALLBACK_SETTERS: Record<string, Array<any>> = {
  Button: [
    {
      name: "type",
      label: "按钮类型",
      type: "radio",
      options: ["primary", "default", "dashed", "text", "link"],
    },
    {
      name: "size",
      label: "尺寸",
      type: "segmented",
      options: ["small", "middle", "large"],
    },
    { name: "danger", label: "危险态", type: "switch" },
    { name: "ghost", label: "幽灵", type: "switch" },
    { name: "block", label: "块级", type: "switch" },
    { name: "loading", label: "加载", type: "switch" },
    {
      name: "htmlType",
      label: "原生类型",
      type: "select",
      options: ["button", "submit", "reset"],
    },
    { name: "href", label: "链接", type: "input" },
    {
      name: "target",
      label: "打开方式",
      type: "select",
      options: ["_self", "_blank", "_parent", "_top"],
    },
    { name: "children", label: "文本", type: "input" },
  ],
};

const FALLBACK_EVENTS: Record<string, Array<any>> = {
  Button: [{ name: "onClick", label: "点击事件" }],
};

/** ========= 生成 wrapper（双通道取 Props） ========= */
function genWrapperFile(target: Target) {
  const hasPropsType = !!target.propsType;
  const importPropsType = hasPropsType
    ? `import type { ${target.propsType!.typeName} } from '${
        target.propsType!.from
      }';`
    : "";

  // 使用“函数声明组件”而不是 React.FC = () => ，提升 docgen 兼容性
  const file = `
/* AUTO-GENERATED. DO NOT EDIT. */
import * as React from 'react';
${target.importStmt}
${importPropsType}

type __A_${target.name} = React.ComponentProps<typeof ${target.componentExpr}>;
${
  hasPropsType ? `type __B_${target.name} = ${target.propsType!.typeName};` : ""
}
type __${target.name}Props = ${
    hasPropsType
      ? `__A_${target.name} & __B_${target.name}`
      : `__A_${target.name}`
  };

export function __Docgen${toPascalCase(target.name)}(props: __${
    target.name
  }Props) { return null as any }
export default __Docgen${toPascalCase(target.name)};
`.trimStart();

  const fp = path.join(TMP_DIR, `${target.name}.tsx`);
  write(fp, file);
  return fp;
}

/** ========= 主流程 ========= */
async function run() {
  ensureDir(OUT_DIR);
  ensureDir(TMP_DIR);
  clearDir(OUT_DIR);
  clearDir(TMP_DIR);

  const files = TARGETS.map(genWrapperFile);

  const parser = withCustomConfig(path.resolve(ROOT, "tsconfig.json"), {
    shouldRemoveUndefinedFromOptional: true,
    shouldExtractLiteralValuesFromEnum: true,
    savePropValueAsString: true,
    // 放宽过滤：先让 props 进入，后用 shouldDropProp 精准控制
    propFilter: (_prop: PropItem) => true,
  });

  const docs = parser.parse(files);

  const seen = new Set<string>();
  const exportLines: string[] = [];

  for (const doc of docs) {
    const displayName = doc.displayName; // __DocgenButton
    const compName = displayName.replace(/^__Docgen/, "");
    const target = TARGETS.find((t) => toPascalCase(t.name) === compName);
    if (!target) continue;
    if (seen.has(target.name)) continue;
    seen.add(target.name);

    const props = (doc.props ?? {}) as Record<string, PropItem>;

    // 调试：看看 docgen 实际拿到的字段
    // console.log('[docgen]', target.name, 'props:', Object.keys(props));

    // 事件：onXxx（含来自 React 的 HTML 事件）
    const events = Object.entries(props)
      .filter(
        ([n, p]) =>
          /^on[A-Z]/.test(n) && ((p.type?.name ?? "") as string).includes("=>")
      )
      .map(([name]) => ({ name, label: name }));

    // setter：过滤 + 映射
    const setters = Object.entries(props)
      .filter(([n, p]) => !shouldDropProp(n, lower(p.type as DocType)))
      .map(([name, p]) => {
        const t = p.type as DocType | undefined;
        const g = guessControlByType(name, t);
        const item: any = {
          name,
          label: FRIENDLY_LABEL[name] ?? name,
          type: g.control,
        };
        if (g.options && g.options.length) {
          item.options = g.options.map((v) => ({ label: String(v), value: v }));
        }
        return item;
      });

    // 默认值（若有就尽量保留）
    const defaultProps: Record<string, any> = {};
    for (const [name, p] of Object.entries(props)) {
      const raw = p.defaultValue?.value;
      if (raw != null) defaultProps[name] = String(raw).replace(QUOTE_TRIM, "");
    }

    // 兜底：如果 docgen 仍然拿不到任何 setter，就用我们内置的 fallback
    const finalSetters =
      setters.length > 0 ? setters : FALLBACK_SETTERS[target.name] ?? [];
    const finalEvents =
      events.length > 0 ? events : FALLBACK_EVENTS[target.name] ?? [];

    if (setters.length === 0) {
      console.warn(
        `[gen-antd] ${target.name} docgen 未解析到 props，使用 fallback setter。`
      );
    }

    // ${target.importStmt} 用不到
    const content = `
/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请调整脚本或 TARGETS。
 */
${COMPONENT_CONFIG_IMPORT}

const meta = {
  name: ${JSON.stringify(target.name)},
  desc: ${JSON.stringify(target.desc ?? `${target.name}（自动生成）`)},
  defaultProps: ${JSON.stringify(defaultProps)},
  setter: ${JSON.stringify(finalSetters, null, 2)},
  events: ${JSON.stringify(finalEvents, null, 2)},
  parentTypes: ["Page", "Container", "Modal"]
} as Omit<ComponentConfig, "dev" | "prod">;

export default meta;
`.trimStart();

    const outFile = path.join(OUT_DIR, `${target.name}.meta.tsx`);
    write(outFile, content);
    console.log(`✔ Generated: ${path.relative(ROOT, outFile)}`);

    exportLines.push(
      `export { default as ${target.name} } from './${target.name}.meta';`
    );
  }

  // 汇总导出
  const indexFile = path.join(OUT_DIR, "index.tsx");
  write(indexFile, `${Array.from(new Set(exportLines)).join("\n")}\n`);
  console.log(`✔ Generated: ${path.relative(ROOT, indexFile)}`);

  // 清理临时目录
  clearDir(TMP_DIR);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
