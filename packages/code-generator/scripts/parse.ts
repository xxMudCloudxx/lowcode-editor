import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SchemaParser } from "../src/parser/schema-parser";
import { CodeGenRegistry } from "../src/registry/codegen-registry";
// 从 materials 包中导入 antd 物料系统的出码出码描述打包配置
// @ts-ignore
import { antdCodeGenPack } from "../../materials/src/codegen";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const snapshotDir = path.resolve(scriptDir, "../__tests__/unit/__snap__/parse");

const inputPath = process.argv[2] ?? path.join(scriptDir, "input.json");

if (!inputPath) {
  console.error(
    "用法: npx tsx scripts/parse.ts [输入的schema.json路径] [输出结果的.json路径]",
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
  let schema;
  try {
    schema = JSON.parse(schemaStr);
  } catch (e) {
    console.error("输入文件解析失败，请确保它是一个合法的 JSON文件");
    process.exit(1);
  }

  // 1. 初始化出码注册表并加载 antd 的出码元数据
  const registry = new CodeGenRegistry();
  registry.loadPack(antdCodeGenPack);

  // 2. 将注册表传入到 SchemaParser 中实例化
  const parser = new SchemaParser(registry);

  // 3. 执行解析
  const irProject = parser.parse(schema);

  // 格式化输出
  const resultStr = JSON.stringify(irProject, null, 2);

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, resultStr, "utf-8");
    console.log(`✅ 解析成功！IR对象层结构结果已写入: ${outputPath}`);
  } else {
    // 未提供输出路径，则直接打印在终端上
    console.log(resultStr);
  }
} catch (error) {
  console.error("❌ 解析过程中发生错误:", (error as Error).message);
  process.exit(1);
}
