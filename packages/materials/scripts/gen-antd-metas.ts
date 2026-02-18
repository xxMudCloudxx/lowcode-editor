/**
 * scripts/gen-antd-metas.ts
 *
 * 作用：扫描物料目录 -> 匹配 component-map -> 解析 AntD 类型 -> 生成 _generated/X.meta.tsx
 * 运行：pnpm run gen:antd
 *
 * 核心改进 (v2):
 * 1. 智能 propFilter：基于 prop.parent.fileName 过滤 HTML 原生属性
 * 2. 白名单豁免：保留 on* 事件回调（onClick, onMouseEnter 等）
 * 3. 更新类型导入路径，匹配新的 component-protocol 类型系统
 */
import * as fs from "fs";
import * as path from "path";
import { withCustomConfig, PropItem } from "react-docgen-typescript";
import { COMPONENT_MAP } from "./component-map.js";

const ROOT = process.cwd();
const MATERIALS_DIR = path.resolve(ROOT, "src");
const OUT_DIR = path.resolve(ROOT, "src/_generated");
const TMP_DIR = path.resolve(ROOT, "scripts/.docgen-temp");

// v2 架构：明确使用 ComponentProtocol 接口
const COMPONENT_CONFIG_IMPORT = `import type { ComponentProtocol } from '@lowcode/schema';`;

/** ========= 工具函数 ========= */
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
  t?: DocType,
): { control: string; options?: string[] } {
  const options = extractLiteralOptions(t);
  if (options.length > 0) return { control: "select", options };
  const tn = lower(t);
  if (tn.includes("boolean")) return { control: "switch" };
  if (tn.includes("number")) return { control: "inputNumber" };
  if (tn.includes("react.reactnode")) return { control: "input" };
  return { control: "input" };
}

/**
 * 黑名单：永远不暴露给低代码编辑器的属性
 * 这些属性要么是内部实现细节，要么对终端用户无意义
 */
const PROP_BLACKLIST = new Set([
  // 基础无用属性
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
  // AntD 内部属性
  "classNames",
  "dropdownRender",
  "popupClassName",
  "getPopupContainer",
  "builtinPlacements",
  "destroyPopupOnHide",
  "autoAdjustOverflow",
  // 其他不需要的属性
  "tabIndex",
  "autoFocus",
  "form",
  // Object.prototype methods
  "toString",
  "toLocaleString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "constructor",
]);

function shouldDropProp(propName: string): boolean {
  return PROP_BLACKLIST.has(propName) || propName.startsWith("__");
}

/**
 * 智能属性过滤器
 *
 * 核心逻辑：
 * 1. 黑名单过滤：排除已知无用属性
 * 2. 白名单豁免：on* 事件回调必须保留（即使来自 @types/react）
 * 3. 来源过滤：排除 @types/react 的通用 HTML 属性（aria-*, data-* 等）
 *
 * 关键洞察：onClick, onMouseEnter 等事件虽然定义在 @types/react/DOMAttributes，
 * 但它们是用户交互的核心，必须白名单豁免
 */
function createPropFilter(prop: PropItem): boolean {
  // Step 1: 黑名单过滤
  if (shouldDropProp(prop.name)) {
    return false;
  }

  // Step 2: 白名单豁免 - 保留所有 on* 事件回调
  // 这些是用户交互的核心，即使定义在 @types/react 也必须保留
  if (/^on[A-Z]/.test(prop.name)) {
    return true;
  }

  // Step 3: 基于声明来源的智能过滤
  if (prop.parent) {
    const fileName = prop.parent.fileName.replace(/\\/g, "/");

    // 排除 React 原生类型（HTMLAttributes, AriaAttributes, DOMAttributes 中的非事件属性）
    if (fileName.includes("node_modules/@types/react")) {
      return false;
    }

    // 排除 csstype（样式相关类型）
    if (fileName.includes("node_modules/csstype")) {
      return false;
    }
  }

  // Step 4: 默认保留（来自 antd 或其他库的特有属性）
  return true;
}

/** 友好的中文标签映射 */
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
  disabled: "禁用",
  placeholder: "占位符",
  allowClear: "可清除",
  maxLength: "最大长度",
  showCount: "显示计数",
  bordered: "边框",
  open: "展开",
  closable: "可关闭",
  mask: "遮罩",
  maskClosable: "点击遮罩关闭",
  centered: "居中",
  width: "宽度",
  okText: "确认文本",
  cancelText: "取消文本",
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
  console.log("🚀 Starting AntD Meta Generation (v2 with smart propFilter)...");

  ensureDir(OUT_DIR);
  ensureDir(TMP_DIR);
  clearDir(TMP_DIR);

  // 扫描分类文件夹，收集所有组件
  const componentsToProcess: { name: string; category: string }[] = [];
  const categoryFolders = fs
    .readdirSync(MATERIALS_DIR, { withFileTypes: true })
    .filter(
      (dirent) =>
        dirent.isDirectory() &&
        !dirent.name.startsWith("_") &&
        dirent.name !== "Page" &&
        dirent.name !== "__tests__",
    );

  for (const categoryDir of categoryFolders) {
    const categoryPath = path.join(MATERIALS_DIR, categoryDir.name);
    fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .forEach((dirent) => {
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
    `📦 Found ${componentsToProcess.length} components, ${filesToParse.length} have mappings.`,
  );
  if (filesToParse.length === 0) return;

  // 配置 DocGen，使用智能 propFilter
  const parser = withCustomConfig(path.resolve(ROOT, "tsconfig.json"), {
    shouldRemoveUndefinedFromOptional: true,
    shouldExtractLiteralValuesFromEnum: true,
    savePropValueAsString: true,
    propFilter: createPropFilter,
  });

  const docs = parser.parse(filesToParse);
  const exportLines: string[] = [];

  for (const doc of docs) {
    if (!doc.props) continue;

    const compName = doc.displayName.replace(/^__Docgen/, "");
    const componentInfo = componentsToProcess.find((c) => c.name === compName);
    const category = componentInfo ? componentInfo.category : "其他";

    const props = (doc.props ?? {}) as Record<string, PropItem>;

    // 分离事件和普通属性
    // 只保留组件特有事件（来自 antd），过滤掉 HTML 原生事件（来自 @types/react）
    const events = Object.entries(props)
      .filter(([n, p]) => {
        if (!/^on[A-Z]/.test(n)) return false;
        // 只保留来自 antd 的事件，过滤掉 @types/react 的原生 HTML 事件
        if (p.parent) {
          const fileName = p.parent.fileName.replace(/\\/g, "/");
          if (fileName.includes("node_modules/@types/react")) {
            return false;
          }
        }
        return true;
      })
      .map(([name]) => ({ name, label: `${name}事件` }));

    const setters = Object.entries(props)
      .filter(([n]) => !/^on[A-Z]/.test(n))
      .map(([name, p]) => {
        const g = guessControlByType(name, p.type as DocType);
        const item: Record<string, unknown> = {
          name,
          label: FRIENDLY_LABEL[name] ?? name,
          type: g.control,
        };
        if (g.options && g.options.length) {
          item.options = g.options.map((v) => ({ label: String(v), value: v }));
        }
        return item;
      });

    // 提取默认值
    const defaultProps: Record<string, unknown> = {};
    for (const [name, p] of Object.entries(props)) {
      const raw = p.defaultValue?.value;
      if (raw != null) defaultProps[name] = String(raw).replace(QUOTE_TRIM, "");
    }

    // 生成文件内容 - 使用 Partial<ComponentProtocol> 声明为协议补丁
    const content = `/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
${COMPONENT_CONFIG_IMPORT}

const meta: Partial<ComponentProtocol> = {
  name: ${JSON.stringify(compName)},
  desc: ${JSON.stringify(compName)},
  category: ${JSON.stringify(category)},
  defaultProps: ${JSON.stringify(defaultProps, null, 2)},
  setter: ${JSON.stringify(setters, null, 2)},
  events: ${JSON.stringify(events, null, 2)},
};

export default meta;
`.trimStart();

    const outFile = path.join(OUT_DIR, `${compName}.meta.tsx`);
    write(outFile, content);
    console.log(
      `✅ Generated: ${compName} (${setters.length} setters, ${events.length} events)`,
    );

    exportLines.push(
      `export { default as ${compName} } from './${compName}.meta';`,
    );
  }

  // 生成 index.tsx
  const indexFile = path.join(OUT_DIR, "index.tsx");
  write(indexFile, `${Array.from(new Set(exportLines)).join("\n")}\n`);
  console.log(`✅ Generated: index.tsx (${exportLines.length} exports)`);

  // 清理临时目录
  clearDir(TMP_DIR);
  console.log("✨ Done!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
