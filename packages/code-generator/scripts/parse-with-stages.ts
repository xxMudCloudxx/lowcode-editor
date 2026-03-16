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

export async function writeTraceSnapshots(params?: {
  inputPath?: string;
  outputPath?: string;
  totalPath?: string;
  solutionName?: string;
}) {
  const nextInputPath = path.resolve(
    process.cwd(),
    params?.inputPath ?? inputPath,
  );
  const nextOutputPath = path.resolve(
    process.cwd(),
    params?.outputPath ?? outputPath,
  );
  const nextTotalPath = path.resolve(
    process.cwd(),
    params?.totalPath ?? totalPath,
  );
  const nextSolutionName = params?.solutionName ?? solutionName;

  if (!fs.existsSync(nextInputPath)) {
    throw new Error(`输入文件不存在: ${nextInputPath}`);
  }

  const schemaStr = fs.readFileSync(nextInputPath, "utf-8");
  let schema: ISchema;

  try {
    schema = JSON.parse(schemaStr) as ISchema;
  } catch {
    throw new Error("输入文件解析失败，请确保它是一个合法的 JSON 文件");
  }

  const result = await traceCodegenPipeline(schema, {
    solution: nextSolutionName,
    materialPack: antdCodeGenPack,
  });

  fs.mkdirSync(path.dirname(nextOutputPath), { recursive: true });
  fs.mkdirSync(path.dirname(nextTotalPath), { recursive: true });
  fs.writeFileSync(
    nextOutputPath,
    JSON.stringify(result.output, null, 2),
    "utf-8",
  );
  fs.writeFileSync(nextTotalPath, JSON.stringify(result, null, 2), "utf-8");

  return {
    result,
    outputPath: nextOutputPath,
    totalPath: nextTotalPath,
  };
}

async function main() {
  const { result, outputPath, totalPath } = await writeTraceSnapshots({
    inputPath: resolvedInputPath,
    outputPath: resolvedOutputPath,
    totalPath: resolvedTotalPath,
    solutionName,
  });

  console.log("✅ 出码链路追踪完成");
  console.log(`- output.json: ${outputPath}`);
  console.log(`- total.json: ${totalPath}`);
  console.log(`- solution: ${result.solution}`);
  console.log("这三个文件可作为快照测试基线使用。");
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectExecution) {
  main().catch((error) => {
    console.error("❌ 追踪过程中发生错误:", (error as Error).message);
    process.exit(1);
  });
}
