/* eslint-disable no-console */
// scripts/export-materials.ts
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

// 导入我们需要的类型
import type {
  ComponentConfig,
  ComponentEvent,
  ComponentSetter,
} from "../src/editor/stores/component-config";

// 获取 __dirname 的标准 ESM 方式
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.cwd();
const MATERIALS_DIR = path.resolve(ROOT, "src/editor/materials");
const OUT_DIR = path.resolve(ROOT, "src/editor/materials/_generated");

/** ========= 工具函数 (从 gen-antd-metas 复制而来) ========= */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function write(file: string, content: string) {
  fs.writeFileSync(file, content.replace(/\r\n/g, "\n"));
}

/** ========= 物料导出逻辑 ========= */

/**
 * 复制 `src/editor/materials/index.tsx` 中的合并逻辑
 */
function mergeEvents(manual?: ComponentEvent[], generated?: ComponentEvent[]) {
  const out: ComponentEvent[] = [...(manual ?? [])];
  for (const e of generated ?? []) {
    if (!out.some((x) => x.name === e.name)) out.push(e);
  }
  return out;
}

/**
 * @description
 * 扫描所有 meta.tsx 文件, 动态导入它们,
 * 并执行与 `src/editor/materials/index.tsx` 相同的合并逻辑,
 * 最终生成 `server/template/materials.json`。
 */
async function exportMaterials() {
  console.log("\n[export-meta] 正在导出合并的 materials.json...");

  // 1. 加载手写物料
  // 模拟 `import.meta.glob`
  const manualMetaPaths = globSync(
    path.join(MATERIALS_DIR, "./**/meta.tsx").replace(/\\/g, "/"),
    {
      // 忽略 _generated 目录
      ignore: [path.join(OUT_DIR, "/**").replace(/\\/g, "/")],
    }
  );

  type MetaModule = { default: Omit<ComponentConfig, "dev" | "prod"> };
  const manualList: Omit<ComponentConfig, "dev" | "prod">[] = [];

  for (const p of manualMetaPaths) {
    // 从 `scripts` 目录动态导入 `src` 目录下的 TSX 文件
    // `tsx` 会处理这个
    const importPath = path.relative(__dirname, p).replace(/\\/g, "/");
    try {
      const module = (await import(importPath)) as MetaModule;
      if (module.default) {
        manualList.push(module.default);
      }
    } catch (e) {
      console.error(`[export-meta] 导入手写 meta 失败: ${importPath}`, e);
    }
  }
  console.log(`[export-meta] 加载了 ${manualList.length} 个手写物料。`);

  // 2. 加载刚生成的 antd 物料
  const generatedList: Omit<ComponentConfig, "dev" | "prod">[] = [];
  try {
    // 导入刚生成的 _generated/index.tsx
    const autoMetas = (await import(
      path
        .relative(__dirname, path.join(OUT_DIR, "index.tsx"))
        .replace(/\\/g, "/")
    )) as Record<string, MetaModule>;

    Object.values(autoMetas).forEach((module) => {
      if (module.default) {
        generatedList.push(module.default);
      }
    });
  } catch (e) {
    console.error(`[export-meta] 导入 _generated/index.tsx 失败。`, e);
  }
  console.log(`[export-meta] 加载了 ${generatedList.length} 个自动生成物料。`);

  // 3. 执行与 `src/editor/materials/index.tsx` 相同的合并逻辑
  const genMap = new Map(generatedList.map((g) => [g.name, g]));

  const mergedManualFirst: Omit<ComponentConfig, "dev" | "prod">[] =
    manualList.map((man) => {
      const gen = genMap.get(man.name);

      const finalSetter: ComponentSetter[] = (
        man.setter && man.setter.length > 0 ? man.setter : (gen?.setter ?? [])
      ) as ComponentSetter[];

      const finalEvents = mergeEvents(man.events, gen?.events);

      const finalDefaultProps = {
        ...(gen?.defaultProps ?? {}),
        ...(man.defaultProps ?? {}),
      };

      const finalItem: Omit<ComponentConfig, "dev" | "prod"> = {
        ...man,
        desc: man.desc ?? gen?.desc ?? man.name,
        defaultProps: finalDefaultProps,
        setter: finalSetter,
        styleSetter: man.styleSetter ?? gen?.styleSetter ?? [],
        events: finalEvents,
        parentTypes: man.parentTypes ?? gen?.parentTypes,
      };

      if (gen) genMap.delete(man.name);
      return finalItem;
    });

  // 4. 合并“只有生成、没有手写”的组件
  const onlyGenerated = Array.from(genMap.values());
  const finalMaterials = [...mergedManualFirst, ...onlyGenerated];

  // 5. 写入 JSON 文件
  const outputPath = path.resolve(ROOT, "server/template/materials.json");
  ensureDir(path.dirname(outputPath));
  write(outputPath, JSON.stringify(finalMaterials, null, 2));

  console.log(
    `[export-meta] 成功！已将 ${finalMaterials.length} 个物料元数据写入: ${path.relative(ROOT, outputPath)}`
  );
}

/** ========= 主流程 ========= */
async function run() {
  try {
    await exportMaterials();
  } catch (e) {
    console.error("[export-meta] 导出 materials.json 失败:", e);
    process.exit(1);
  }
}

// 启动主流程
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
