import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SchemaParser } from "../src/parser/schema-parser";
import { CodeGenRegistry } from "../src/registry/codegen-registry";
import { stateLifterPreprocessor } from "../src/preprocessor/state-lifter";
// @ts-ignore
import { antdCodeGenPack } from "../../materials/src/codegen";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const snapshotDir = path.resolve(
  scriptDir,
  "../__tests__/unit/__snap__/parse-with-lifter",
);

const inputPath = process.argv[2] ?? path.join(scriptDir, "input.json");

if (!inputPath) {
  console.error(
    "用法: npx tsx scripts/parse-with-lifter.ts [输入的schema.json路径] [输出结果的.json路径]",
  );
  process.exit(1);
}

const resolvedInputPath = path.resolve(process.cwd(), inputPath);
if (!fs.existsSync(resolvedInputPath)) {
  console.error(`输入文件不存在: ${resolvedInputPath}`);
  process.exit(1);
}

const outputPath = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.join(snapshotDir, "output.json");

try {
  const schemaStr = fs.readFileSync(resolvedInputPath, "utf-8");
  const schema = JSON.parse(schemaStr);

  // 1. 初始化出码注册表并加载 antd 的出码元数据
  const registry = new CodeGenRegistry();
  registry.loadPack(antdCodeGenPack);

  // 2. 将注册表传入到 SchemaParser 中实例化
  const parser = new SchemaParser(registry);

  // 3. 执行单步解析 (Raw IR)
  const rawIrProject = parser.parse(schema);

  // 4. 执行状态提升预处理器 (Lifter IR)
  // 注意：stateLifter 内部会直接修改传入的对象，所以这里需要一个克隆来展示差异，或者我们就直接看运行后的结果
  const liftedIrProject = stateLifterPreprocessor.run(rawIrProject, {
    registry,
    buildVariables: {},
  } as any);

  // 格式化输出
  const resultStr = JSON.stringify(liftedIrProject, null, 2);

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, resultStr, "utf-8");
    console.log(
      `✅ Lifter 处理成功！注入状态的新 IR 结构已写入: ${outputPath}`,
    );
  } else {
    console.log(resultStr);
  }
} catch (error) {
  console.error("❌ 解析过程中发生错误:", (error as Error).message);
  process.exit(1);
}
