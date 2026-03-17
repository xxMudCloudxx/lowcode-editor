import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ISchema } from "@lowcode/schema";
import { traceCodegenPipeline } from "../src/debug/pipeline-trace";
// @ts-ignore
import { antdCodeGenPack } from "../../materials/src/codegen";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const snapshotDir = path.resolve(
  scriptDir,
  "../__tests__/unit/__snap__/parse-with-stages",
);

const inputPath = process.argv[2] ?? path.join(scriptDir, "input.json");
const outputPath = process.argv[3] ?? path.join(snapshotDir, "output.json");
const totalPath = process.argv[4] ?? path.join(snapshotDir, "total.json");
const solutionName = process.argv[5] ?? "react-vite";

function exitWithUsage() {
  console.error(
    "用法: npx tsx scripts/parse-with-stages.ts [输入schema.json路径] [输出output.json路径] [输出total.json路径] [solution名称]",
  );
  process.exit(1);
}

if (process.argv.length > 6) {
  exitWithUsage();
}

const resolvedInputPath = path.resolve(process.cwd(), inputPath);
if (!fs.existsSync(resolvedInputPath)) {
  console.error(`输入文件不存在: ${resolvedInputPath}`);
  process.exit(1);
}

const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
const resolvedTotalPath = path.resolve(process.cwd(), totalPath);

async function main() {
  const schemaStr = fs.readFileSync(resolvedInputPath, "utf-8");
  let schema: ISchema;

  try {
    schema = JSON.parse(schemaStr) as ISchema;
  } catch {
    console.error("输入文件解析失败，请确保它是一个合法的 JSON 文件");
    process.exit(1);
  }

  const result = await traceCodegenPipeline(schema, {
    solution: solutionName,
    materialPack: antdCodeGenPack,
  });

  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  fs.mkdirSync(path.dirname(resolvedTotalPath), { recursive: true });
  fs.writeFileSync(
    resolvedOutputPath,
    JSON.stringify(result.output, null, 2),
    "utf-8",
  );
  fs.writeFileSync(
    resolvedTotalPath,
    JSON.stringify(result, null, 2),
    "utf-8",
  );

  console.log("✅ 出码链路追踪完成");
  console.log(`- output.json: ${resolvedOutputPath}`);
  console.log(`- total.json: ${resolvedTotalPath}`);
  console.log(`- solution: ${result.solution}`);
  console.log("这三个文件可作为快照测试基线使用。");
}

main().catch((error) => {
  console.error("❌ 追踪过程中发生错误:", (error as Error).message);
  process.exit(1);
});
