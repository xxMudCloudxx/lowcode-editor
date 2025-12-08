/* eslint-disable no-console */
/**
 * @file scripts/export-materials.ts
 * @description 导出 AI 专用的物料元数据 (适配 ComponentProtocol v2)
 *
 * 功能：
 * 1. 扫描所有 meta.tsx 文件（新的 ComponentProtocol 格式）
 * 2. 提取 AI 生成所需的精简信息（移除 component、lazy 等）
 * 3. 生成 server/template/materials-ai.json
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

// 获取 __dirname 的标准 ESM 方式
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.cwd();
const MATERIALS_DIR = path.resolve(ROOT, "src/editor/materials");
const OUT_DIR = path.resolve(ROOT, "server/template");

/** ========= 工具函数 ========= */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function write(file: string, content: string) {
  fs.writeFileSync(file, content.replace(/\r\n/g, "\n"));
}

/** ========= AI 物料元数据接口 ========= */
interface AIMaterialMeta {
  name: string;
  desc: string;
  category?: string;
  parentTypes?: string[];
  isContainer?: boolean;
  defaultProps: Record<string, unknown>;
  props: {
    name: string | string[];
    label: string;
    type: string;
    options?: unknown[];
  }[];
  events?: { name: string; label: string }[];
  methods?: { name: string; label: string }[];
}

/** ========= 物料导出逻辑 ========= */

/**
 * @description
 * 扫描所有 meta.tsx 文件，动态导入它们，
 * 提取 AI 所需的精简信息，生成 materials-ai.json。
 */
async function exportMaterials() {
  console.log("\n[export-materials] 正在导出 AI 物料元数据...");

  // 1. 扫描所有 meta.tsx 文件
  const metaPaths = globSync(
    path.join(MATERIALS_DIR, "./**/meta.tsx").replace(/\\/g, "/"),
    {
      // 忽略 _generated 和 __tests__ 目录
      ignore: [
        path.join(MATERIALS_DIR, "_generated/**").replace(/\\/g, "/"),
        path.join(MATERIALS_DIR, "__tests__/**").replace(/\\/g, "/"),
      ],
    }
  );

  console.log(`[export-materials] 发现 ${metaPaths.length} 个 meta.tsx 文件`);

  const materials: AIMaterialMeta[] = [];

  for (const p of metaPaths) {
    const importPath = path.relative(__dirname, p).replace(/\\/g, "/");
    try {
      // 动态导入 meta.tsx
      const module = await import(importPath);
      const protocol = module.default;

      if (!protocol || !protocol.name) {
        console.warn(`[export-materials] 跳过无效 meta: ${importPath}`);
        continue;
      }

      // 提取 AI 所需的精简信息
      const meta: AIMaterialMeta = {
        name: protocol.name,
        desc: protocol.desc || protocol.name,
        category: protocol.category,
        // 从 editor 配置中提取
        parentTypes: protocol.editor?.parentTypes,
        isContainer: protocol.editor?.isContainer,
        defaultProps: protocol.defaultProps || {},
        // 提取 setter 并精简
        props: (protocol.setter || []).map((s: any) => ({
          name: s.name,
          label: s.label,
          type: s.type,
          ...(s.options ? { options: s.options } : {}),
        })),
        events: protocol.events,
        methods: protocol.methods,
      };

      materials.push(meta);
    } catch (e) {
      console.error(`[export-materials] 导入失败: ${importPath}`, e);
    }
  }

  // 2. 按分类排序
  materials.sort((a, b) => {
    const categoryOrder = [
      "布局",
      "基础",
      "导航",
      "数据录入",
      "数据展示",
      "反馈",
    ];
    const aIndex = categoryOrder.indexOf(a.category || "");
    const bIndex = categoryOrder.indexOf(b.category || "");
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });

  // 3. 写入 JSON 文件
  ensureDir(OUT_DIR);
  const outputPath = path.resolve(OUT_DIR, "materials-ai.json");
  write(outputPath, JSON.stringify(materials, null, 2));

  console.log(
    `[export-materials] ✅ 成功！已将 ${materials.length} 个物料写入: ${path.relative(ROOT, outputPath)}`
  );

  // 4. 同时生成组件名枚举（供 Zod Schema 使用）
  const componentNames = materials.map((m) => m.name);
  const enumPath = path.resolve(OUT_DIR, "component-names.json");
  write(enumPath, JSON.stringify(componentNames, null, 2));
  console.log(
    `[export-materials] ✅ 组件名枚举已写入: ${path.relative(ROOT, enumPath)}`
  );
}

/** ========= 主流程 ========= */
async function run() {
  try {
    await exportMaterials();
  } catch (e) {
    console.error("[export-materials] 导出失败:", e);
    process.exit(1);
  }
}

// 启动主流程
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
