/**
 * @file /server/index.ts
 * @description 🚀 零代码 AI 页面生成器后端 (LangChain.js v0.3+ 修正版 + 全面错误调试日志)
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

// --- 1. 环境与配置初始化 ---

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --- 2. 加载 AI 上下文文件 ---

function loadDynamicData(): {
  materialsListJson: string;
  schemaExampleJson: string;
} {
  try {
    const materialsPath = path.resolve("server/template/materials.json");
    const schemaExamplePath = path.resolve(
      "server/template/lowcode-schema.json"
    );

    const materialsListJson = readFileSync(materialsPath, "utf-8");
    const schemaExampleJson = readFileSync(schemaExamplePath, "utf-8");

    if (!materialsListJson || !schemaExampleJson) {
      throw new Error("上下文文件为空或无效。");
    }

    console.log("[AI Server] ✅ 动态上下文加载成功 (物料库, Schema范例)");
    return { materialsListJson, schemaExampleJson };
  } catch (error) {
    console.error("❌ 加载动态上下文失败:", error);
    throw new Error("服务器配置错误：无法加载 AI 上下文文件。");
  }
}

const { materialsListJson, schemaExampleJson } = loadDynamicData();

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
  async (input: { text: string; image_data: string | null }) => {
    const messages = [
      new SystemMessage(`
你是一个专业的前端 UI 设计师和低代码架构师。
任务：分析用户提供的文本描述和（可选）UI 截图，输出一个结构化的中间意图 JSON。
输出格式：{ "description": string, "layout": object, "components": array }
规则：输出必须是纯 JSON，不含 Markdown、注释或代码块。
`),
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

  // --- 模型调用阶段 ---
  async (messages) => {
    try {
      console.log("🧠 调试信息: 正在调用阶段一模型");
      console.log("🔑 OPENAI_BASE_URL =", baseUrl);
      console.log(
        "🔑 OPENAI_API_KEY (前5位) =",
        process.env.OPENAI_API_KEY?.slice(0, 5) || "未定义"
      );
      console.log("🧾 消息数量 =", messages.length);

      const response = await visionModel.invoke(messages);
      console.log("✅ 模型原始响应对象:", response);

      const content = response?.content ?? null;
      if (!content) throw new Error("阶段一输出为空");

      console.log("🧩 模型输出内容预览:", content.slice(0, 150));
      return { content }; // ✅ 确保返回标准结构
    } catch (err: any) {
      console.error("❌ 阶段一模型调用失败:", err.message || err);
      throw err;
    }
  },

  async (aiMessage) => {
    try {
      const parsed = await intentParser.invoke(aiMessage.content);
      return parsed;
    } catch (err) {
      console.error("❌ 阶段一 JSON 解析失败: 模型输出非纯 JSON");
      console.error("🪶 原始输出:", aiMessage?.content);
      throw err;
    }
  },
]);

// --- 5. 阶段二：Schema 生成链 ---

const schemaGenerationChain = RunnableSequence.from([
  async (input: { user_intent_json: string }) => {
    const systemPrompt = `
你是一个低代码平台 Schema 生成引擎。
任务：根据“页面意图 JSON”和“物料库”生成 Component[] JSON。
严格输出合法 JSON 数组，无解释、无代码块。

interface Component {
  id: number;
  name: string;
  desc: string;
  props: any;
  styles?: object;
  parentId?: number;
  children?: Component[];
}

【物料库】
${materialsListJson}

【黄金标准范例】
${schemaExampleJson}
`;
    return [
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `【用户意图】\n${input.user_intent_json}\n\n请严格输出 Component[] JSON：`
      ),
    ];
  },

  async (messages) => {
    try {
      console.log("🧠 调试信息: 正在调用阶段二模型");
      const response = await generationModel.invoke(messages);
      console.log("✅ 阶段二原始响应:", response);

      const content = response?.content ?? null;
      if (!content) throw new Error("阶段二输出为空");

      return { content };
    } catch (err: any) {
      console.error("❌ 阶段二模型调用失败:", err.message || err);
      throw err;
    }
  },

  async (aiMessage) => {
    try {
      const parsed = await schemaParser.invoke(aiMessage.content);
      return parsed;
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
