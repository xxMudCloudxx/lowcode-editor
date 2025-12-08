/**
 * @file /server/index.ts
 * @description 🚀 零代码 AI 页面生成器后端 (v3 重构版)
 *
 * 核心改进：
 * 1. 使用 JsonOutputParser（比 Structured Output 更兼容）
 * 2. Core + Recall 动态物料筛选
 * 3. Linter 后处理器进行语义修正
 *
 * 注意：由于 API 提供商对 Structured Output 支持有限，
 * 暂时回退到 JsonOutputParser + 严格 Prompt 的方案
 */

import express from "express";
import cors from "cors";
import path from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// AI 核心模块
import {
  fixComponentTree,
  convertToComponentTree,
  type LinterNode,
} from "./linter";

// 加载物料元数据
import materialsAI from "./template/materials-ai.json";
import componentNames from "./template/component-names.json";

// --- 1. 环境与配置初始化 ---

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const API_TIMEOUT_MS = 60000;

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --- 2. Core + Recall 物料策略 ---

const CORE_COMPONENTS = new Set([
  "Page",
  "Container",
  "Grid",
  "GridColumn",
  "Typography",
  "Button",
  "Icon",
  "Space",
]);

const VALID_COMPONENT_NAMES = new Set(componentNames);

function getMaterialContext(suggestedComponents: string[] = []): string {
  // 过滤无效组件名
  const validSuggested = suggestedComponents.filter((name) =>
    VALID_COMPONENT_NAMES.has(name)
  );

  const activeNames = new Set([...CORE_COMPONENTS, ...validSuggested]);

  const context = (materialsAI as any[])
    .filter((m) => activeNames.has(m.name))
    .map((m) => ({
      name: m.name,
      desc: m.desc,
      category: m.category,
      parentTypes: m.parentTypes,
      isContainer: m.isContainer,
      defaultProps: m.defaultProps,
      props: m.props?.slice(0, 5),
    }));

  return JSON.stringify(context, null, 2);
}

// --- 3. 加载提示词 ---

function loadPrompts(): {
  intentSystemPrompt: string;
  schemaSystemPrompt: string;
} {
  const read = (p: string) =>
    readFileSync(path.resolve(process.cwd(), p), "utf-8");

  const intentSystemPrompt = read("server/prompts/intent_system.md");
  const schemaRole = read("server/prompts/schema_role.md");
  let schemaSystemTemplate = read("server/prompts/schema_system_template.md");

  const schemaSystemPrompt = schemaSystemTemplate.replace(
    "{{ROLE_DEFINITION}}",
    schemaRole
  );

  return { intentSystemPrompt, schemaSystemPrompt };
}

// --- 4. 模型初始化 ---

const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const visionModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.3,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: baseUrl, timeout: API_TIMEOUT_MS },
});

const generationModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.1,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: baseUrl, timeout: API_TIMEOUT_MS },
});

// JSON 解析器
const jsonParser = new JsonOutputParser();

// --- 5. 意图分析接口 ---

interface IntentResult {
  description: string;
  layoutType: string;
  suggestedComponents: string[];
}

// --- 6. 主生成流程 ---

async function generatePage(text: string, imageData: string | null) {
  const { intentSystemPrompt, schemaSystemPrompt } = loadPrompts();

  // ===== Phase 1: 意图分析 =====
  console.log("\n🧠 Phase 1: 意图分析...");

  const intentMessages: (SystemMessage | HumanMessage)[] = [
    new SystemMessage(intentSystemPrompt),
    new HumanMessage(`请分析以下用户需求：\n\n"${text}"`),
  ];

  if (imageData) {
    intentMessages.push(
      new HumanMessage({
        content: [
          { type: "text", text: "以下是参考截图：" },
          { type: "image_url", image_url: { url: imageData } },
        ],
      })
    );
  }

  const intentResponse = await visionModel.invoke(intentMessages);
  const intent = (await jsonParser.invoke(
    intentResponse.content as string
  )) as IntentResult;

  // 过滤无效组件名
  intent.suggestedComponents = intent.suggestedComponents.filter((name) =>
    VALID_COMPONENT_NAMES.has(name)
  );

  console.log("✅ 意图分析结果:");
  console.log("  - 描述:", intent.description?.slice(0, 80) + "...");
  console.log("  - 布局类型:", intent.layoutType);
  console.log("  - 有效组件:", intent.suggestedComponents.join(", "));

  // ===== Phase 2: Schema 生成 =====
  console.log("\n🏗️ Phase 2: Schema 生成...");

  const materialContext = getMaterialContext(intent.suggestedComponents);

  const finalSchemaPrompt = schemaSystemPrompt
    .replace("{{MATERIALS_LIST}}", materialContext)
    .replace("{{SCHEMA_EXAMPLE}}", "");

  const schemaMessages = [
    new SystemMessage(finalSchemaPrompt),
    new HumanMessage(
      `用户需求：${intent.description}\n\n` +
        `布局类型：${intent.layoutType}\n\n` +
        `可用组件：${[...CORE_COMPONENTS, ...intent.suggestedComponents].join(", ")}\n\n` +
        `请生成页面 Schema JSON。注意：输出必须是纯 JSON，不要任何 Markdown 或解释。`
    ),
  ];

  const schemaResponse = await generationModel.invoke(schemaMessages);
  const pageResult = (await jsonParser.invoke(
    schemaResponse.content as string
  )) as any;

  console.log("✅ Schema 生成完成");

  // ===== Phase 3: Linter 语义修正 =====
  console.log("\n🔧 Phase 3: Linter 修正...");

  // 处理两种可能的输出格式
  let rootNode: LinterNode;
  if (pageResult.root) {
    rootNode = pageResult.root;
  } else if (Array.isArray(pageResult)) {
    rootNode = pageResult[0];
  } else {
    rootNode = pageResult;
  }

  // 确保基本结构
  if (!rootNode.props) rootNode.props = {};
  if (!rootNode.styles) rootNode.styles = {};
  if (!rootNode.children) rootNode.children = [];

  const fixedRoot = fixComponentTree(rootNode);
  const finalSchema = convertToComponentTree(fixedRoot);

  console.log("✅ Linter 修正完成");

  return [finalSchema];
}

// --- 7. API 路由 ---

app.post("/api/generate-page", async (req, res) => {
  try {
    const { text, image } = req.body;
    if (!text && !image) {
      return res.status(400).json({ message: "请输入描述或上传图片" });
    }

    console.log("\n🚀 收到请求：", text?.slice(0, 100) || "[图片]");

    const finalSchema = await generatePage(
      text || "请分析这张图片并生成页面",
      image || null
    );

    console.log("\n✅ 最终 Schema 生成成功");
    res.status(200).json(finalSchema);
  } catch (error: any) {
    console.error("❌ AI 管道执行失败:", error);
    res.status(500).json({
      message: "AI 生成失败",
      reason: error.message || "未知错误",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// --- 8. 启动服务器 ---

app.listen(port, () => {
  console.log(`[AI Server] ✅ 后端启动成功：http://localhost:${port}`);
  console.log(`[AI Server] 📦 已加载 ${(materialsAI as any[]).length} 个物料`);
  console.log(`[AI Server] 🎯 Core 组件: ${[...CORE_COMPONENTS].join(", ")}`);
  console.log(`[AI Server] ⚠️ 使用 JsonOutputParser（更兼容）`);
});
