/**
 * @file /server/index.ts
 * @description 🚀 零代码 AI 页面生成器后端 (LangChain.js v0.3+ | 提示词文件化重构)
 * @description 将所有提示词外化到 /server/prompts/ 目录中，实现逻辑与内容分离。
 */

import express from "express";
import cors from "cors";
import path from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Component } from "../src/editor/stores/components";
import { PromptTemplate } from "@langchain/core/prompts";

// --- 1. 环境与配置初始化 ---

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --- 2. 加载 AI 上下文与提示词 ---

/**
 * @function loadAiContext
 * @description 同步加载 AI 运行所需的动态上下文文件和提示词模板。
 * @returns {object} 包含加载内容的上下文对象。
 * @throws {Error} 如果任何文件读取失败或内容为空，则抛出异常。
 */
function loadAiContext(): {
  materialsListJson: string;
  schemaExampleJson: string;
  intentSystemPrompt: string;
  schemaSystemPrompt: string;
} {
  try {
    const read = (p: string) =>
      readFileSync(path.resolve(process.cwd(), p), "utf-8");

    // 加载动态数据
    const materialsListJson = read("server/template/materials.json");
    const schemaExampleJson = read("server/template/lowcode-schema.json");

    // 加载提示词文件
    const intentSystemPrompt = read("server/prompts/intent_system.md");
    const schemaRole = read("server/prompts/schema_role.md");
    let schemaSystemTemplate = read("server/prompts/schema_system_template.md");

    if (
      !materialsListJson ||
      !schemaExampleJson ||
      !intentSystemPrompt ||
      !schemaRole ||
      !schemaSystemTemplate
    ) {
      throw new Error("上下文文件或提示词文件为空或无效。");
    }

    // 将动态内容注入到 Schema 系统提示词模板中
    const schemaSystemPrompt = schemaSystemTemplate
      .replace("{{ROLE_DEFINITION}}", schemaRole)
      .replace("{{MATERIALS_LIST}}", materialsListJson)
      .replace("{{SCHEMA_EXAMPLE}}", schemaExampleJson);

    console.log("[AI Server] ✅ 动态上下文与提示词加载并注入成功。");
    return {
      materialsListJson, // (保留，也许其他地方会用)
      schemaExampleJson, // (保留，也许其他地方会用)
      intentSystemPrompt,
      schemaSystemPrompt,
    };
  } catch (error) {
    console.error("❌ 加载 AI 上下文或提示词失败:", error);
    throw new Error("服务器配置错误：无法加载 AI 上下文文件。");
  }
}

// 在服务启动时加载所有内容
const { intentSystemPrompt, schemaSystemPrompt } = loadAiContext();

// --- 3. 模型与解析器初始化 ---

const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const visionModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.2,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: baseUrl },
});

const generationModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: baseUrl },
});

const intentParser = new JsonOutputParser();
const schemaParser = new JsonOutputParser<Component[]>();

// --- 4. 阶段一：意图识别链 ---

const intentChain = RunnableSequence.from([
  // 1. 动态构建消息列表
  async (input: { text: string; image_data: string | null }) => {
    const messages: (SystemMessage | HumanMessage)[] = [
      new SystemMessage(intentSystemPrompt), // ✅ 使用从文件加载的提示词
      new HumanMessage(
        `请根据以下内容生成“中间意图” JSON：\n\n"${input.text}"`
      ),
    ];

    if (input.image_data) {
      messages.push(
        new HumanMessage({
          content: [
            { type: "text", text: "以下是页面截图：" },
            {
              type: "image_url",
              image_url: { url: input.image_data },
            },
          ],
        })
      );
    }
    return messages;
  },

  // 2. 调用多模态模型
  async (messages) => {
    try {
      console.log("🧠 调试信息: 正在调用阶段一模型 (Vision)");
      // ... (其他日志保持不变)
      const response = await visionModel.invoke(messages);
      const content = response?.content ?? null;
      if (!content) throw new Error("阶段一模型输出为空");
      console.log("✅ 阶段一原始响应 (预览):", String(content).slice(0, 150));
      return { content };
    } catch (err: any) {
      console.error("❌ 阶段一模型调用失败:", err.message || err);
      throw err;
    }
  },

  // 3. 解析 JSON 输出
  async (aiMessage) => {
    try {
      return await intentParser.invoke(aiMessage.content as string);
    } catch (err) {
      console.error("❌ 阶段一 JSON 解析失败: 模型输出非纯 JSON");
      console.error("🪶 原始输出:", aiMessage?.content);
      throw err;
    }
  },
]);

// --- 5. 阶段二：Schema 生成链 ---

/**
 * @constant SCHEMA_HUMAN_TEMPLATE
 * @description 阶段二（Schema 生成）的用户提示词模板。
 */
const SCHEMA_HUMAN_TEMPLATE = new PromptTemplate({
  template: "【用户意图】\n{user_intent_json}\n\n请严格输出 Component[] JSON：",
  inputVariables: ["user_intent_json"],
});

const schemaGenerationChain = RunnableSequence.from([
  // 1. 构建消息列表
  async (input: { user_intent_json: string }) => {
    const humanMessage = await SCHEMA_HUMAN_TEMPLATE.format(input);
    return [
      new SystemMessage(schemaSystemPrompt), // ✅ 使用从文件加载并注入的提示词
      new HumanMessage(humanMessage),
    ];
  },

  // 2. 调用生成模型
  async (messages) => {
    try {
      console.log("🧠 调试信息: 正在调用阶段二模型 (Generation)");
      const response = await generationModel.invoke(messages);
      const content = response?.content ?? null;
      if (!content) throw new Error("阶段二输出为空");
      console.log("✅ 阶段二原始响应 (预览):", String(content).slice(0, 150));
      return { content };
    } catch (err: any) {
      console.error("❌ 阶段二模型调用失败:", err.message || err);
      throw err;
    }
  },

  // 3. 解析 JSON 输出
  async (aiMessage) => {
    try {
      return await schemaParser.invoke(aiMessage.content as string);
    } catch (err) {
      console.error("❌ 阶段二 JSON 解析失败: 模型输出非纯 JSON");
      console.error("🪶 原始输出:", aiMessage?.content);
      throw err;
    }
  },
]);

// --- 6. 主管道组合 ---

const mainChain = RunnableSequence.from([
  intentChain,
  async (intentJson) => {
    console.log("\n🧩 阶段一结果 (中间意图):\n");
    console.dir(intentJson, { depth: null });
    return { user_intent_json: JSON.stringify(intentJson, null, 2) };
  },
  schemaGenerationChain,
]);

// --- 7. API 路由定义 ---

app.post("/api/generate-page", async (req, res) => {
  try {
    const { text, image } = req.body;
    if (!text && !image) {
      return res.status(400).json({ message: "请输入描述或上传图片" });
    }

    const input = {
      text: text || "请分析这张图片并生成页面",
      image_data: image || null,
    };

    console.log("\n🚀 收到请求：", input.text.slice(0, 100));
    const finalSchema = await mainChain.invoke(input);

    console.log(
      "\n✅ 阶段二结果 (最终 Schema JSON):\n",
      JSON.stringify(finalSchema, null, 2)
    );

    res.status(200).json(finalSchema);
  } catch (error: any) {
    console.error("❌ AI 管道执行失败:", error);
    res.status(500).json({
      message: "AI 生成失败",
      reason: error.message?.includes("解析")
        ? "模型输出非纯 JSON"
        : error.message || "未知错误",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// --- 8. 启动服务器 ---

app.listen(port, () => {
  console.log(`[AI Server] ✅ OpenAI 后端启动成功：http://localhost:${port}`);
});
