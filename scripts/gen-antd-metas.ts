/* eslint-disable no-console */
// scripts/gen-antd-metas.ts
import * as fs from "fs";
import * as path from "path";
import { withCustomConfig, PropItem } from "react-docgen-typescript";
import { COMPONENT_MAP } from "./component-map.js";

const ROOT = process.cwd();
const MATERIALS_DIR = path.resolve(ROOT, "src/editor/materials");
const OUT_DIR = path.resolve(ROOT, "src/editor/materials/_generated");
const TMP_DIR = path.resolve(ROOT, "scripts/.docgen-temp");

const COMPONENT_CONFIG_IMPORT = `import type { ComponentConfig } from '../../stores/component-config';`;

/** ========= 工具函数 (保持不变) ========= */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function write(file: string, content: string) {
  fs.writeFileSync(file, content.replace(/\r\n/g, "\n"));
}
function clearDir(dir: string) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir))
      fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  }
}
const QUOTE_TRIM = /^['"`]|['"`]$/g;
type DocType = { name?: string; raw?: string; value?: unknown };
function extractLiteralOptions(t?: DocType): string[] {
  if (!t) return [];
  const out: string[] = [];
  const v = t.value as unknown;
  if (Array.isArray(v)) {
    for (const item of v as Array<{ value?: unknown }>) {
      const s = String(item?.value ?? "").trim();
      if (s) out.push(s.replace(QUOTE_TRIM, ""));
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
  return Array.from(new Set(out));
}
function lower(t?: DocType): string {
  return (t?.name ?? t?.raw ?? "").toString().toLowerCase();
}
function guessControlByType(
  propName: string,
  t?: DocType
): { control: string; options?: string[] } {
  const options = extractLiteralOptions(t);
  if (options.length > 0) return { control: "select", options };
  const tn = lower(t);
  if (tn.includes("boolean")) return { control: "switch" };
  if (tn.includes("number")) return { control: "inputNumber" };
  if (tn.includes("react.reactnode")) return { control: "input" };
  return { control: "input" };
}
function shouldDropProp(propName: string) {
  const blacklist = new Set([
    "style",
    "styles",
    "className",
    "children",
    "id",
    "name",
    "isSelected",
    "ref",
    "key",
    "prefixCls",
    "rootClassName",
  ]);
  return blacklist.has(propName) || propName.startsWith("__");
}
const FRIENDLY_LABEL: Record<string, string> = {
  type: "类型",
  size: "尺寸",
  danger: "危险态",
  ghost: "幽灵",
  block: "块级",
  loading: "加载中",
  href: "链接",
  title: "标题",
  text: "文本",
};

/** ========= 生成临时 wrapper 文件 ========= */
function generateWrapperFile(componentName: string) {
  const config = COMPONENT_MAP[componentName];
  if (!config) return null;
  const fileContent = `
/* AUTO-GENERATED for react-docgen. DO NOT EDIT. */
import type { ${config.propsType.typeName} } from '${config.propsType.from}';
export function __Docgen${componentName}(props: ${config.propsType.typeName}) { return null; }
export default __Docgen${componentName};
    `.trim();
  const filePath = path.join(TMP_DIR, `${componentName}.tsx`);
  write(filePath, fileContent);
  return filePath;
}

/** ========= 主流程 ========= */
async function run() {
  ensureDir(OUT_DIR);
  ensureDir(TMP_DIR);
  clearDir(TMP_DIR);

  // 关键修正：重构文件扫描逻辑，深入到分类文件夹内部
  const componentsToProcess: { name: string; category: string }[] = [];
  const categoryFolders = fs
    .readdirSync(MATERIALS_DIR, { withFileTypes: true })
    .filter(
      (dirent) =>
        dirent.isDirectory() &&
        !dirent.name.startsWith("_") &&
        dirent.name !== "Page"
    );

  for (const categoryDir of categoryFolders) {
    const categoryPath = path.join(MATERIALS_DIR, categoryDir.name);
    const componentDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        componentsToProcess.push({
          name: dirent.name,
          category: categoryDir.name,
        });
      });
  }

  const filesToParse = componentsToProcess
    .map((comp) => generateWrapperFile(comp.name))
    .filter((f): f is string => !!f);

  console.log(
    `[gen-meta] Found ${filesToParse.length} components with mappings to process.`
  );
  if (filesToParse.length === 0) return;

  const parser = withCustomConfig(path.resolve(ROOT, "tsconfig.json"), {
    shouldRemoveUndefinedFromOptional: true,
    shouldExtractLiteralValuesFromEnum: true,
    savePropValueAsString: true,
    propFilter: (prop: PropItem) => !shouldDropProp(prop.name),
  });

  const docs = parser.parse(filesToParse);
  const exportLines: string[] = [];

  for (const doc of docs) {
    if (!doc.props) continue;

    const compName = doc.displayName.replace(/^__Docgen/, "");
    const componentInfo = componentsToProcess.find((c) => c.name === compName);
    const category = componentInfo ? componentInfo.category : "其他";

    const props = (doc.props ?? {}) as Record<string, PropItem>;
    const events = Object.entries(props)
      .filter(([n]) => /^on[A-Z]/.test(n))
      .map(([name]) => ({ name, label: `${name}事件` }));
    const setters = Object.entries(props)
      .filter(([n]) => !/^on[A-Z]/.test(n))
      .map(([name, p]) => {
        const g = guessControlByType(name, p.type as DocType);
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
    const defaultProps: Record<string, any> = {};
    for (const [name, p] of Object.entries(props)) {
      const raw = p.defaultValue?.value;
      if (raw != null) defaultProps[name] = String(raw).replace(QUOTE_TRIM, "");
    }

    const content =
      `/* eslint-disable */\n/**\n * 此文件由 scripts/gen-antd-metas.ts 自动生成。\n * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。\n */\n${COMPONENT_CONFIG_IMPORT}\n\nconst meta = {\n  name: ${JSON.stringify(
        compName
      )},\n  desc: ${JSON.stringify(compName)},\n  category: ${JSON.stringify(
        category
      )},\n  defaultProps: ${JSON.stringify(
        defaultProps,
        null,
        2
      )},\n  setter: ${JSON.stringify(
        setters,
        null,
        2
      )},\n  events: ${JSON.stringify(
        events,
        null,
        2
      )},\n} as Omit<ComponentConfig, "dev" | "prod">;\n\nexport default meta;\n`.trimStart();

    const outFile = path.join(OUT_DIR, `${compName}.meta.tsx`);
    write(outFile, content);
    console.log(`✔ Generated: ${path.relative(ROOT, outFile)}`);

    exportLines.push(
      `export { default as ${compName} } from './${compName}.meta';`
    );
  }

  const indexFile = path.join(OUT_DIR, "index.tsx");
  write(indexFile, `${Array.from(new Set(exportLines)).join("\n")}\n`);
  console.log(`✔ Generated: ${path.relative(ROOT, indexFile)}`);

  clearDir(TMP_DIR);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
