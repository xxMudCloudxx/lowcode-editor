import express from "express";
import cors from "cors";
import { exportSourceCode } from "@lowcode/code-generator";
import { antdCodeGenPack } from "@lowcode/materials/codegen";
import type { ISchema } from "@lowcode/schema";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/**
 * POST /api/codegen
 *
 * Body: { schema: ISchema, solution?: string }
 * Response: { success: boolean, files?: IGeneratedFile[], message?: string }
 *
 * 服务端出码：接收前端传入的 schema，调用 code-generator 生成文件列表并返回。
 * 与客户端出码使用完全相同的 exportSourceCode + antdCodeGenPack，
 * 区别仅在于运行环境从浏览器迁移到 Node.js。
 */
app.post("/api/codegen", async (req, res) => {
  const { schema, solution = "react-vite" } = req.body as {
    schema: ISchema;
    solution?: string;
  };

  if (!schema || !Array.isArray(schema)) {
    res.status(400).json({ success: false, message: "schema 不合法" });
    return;
  }

  try {
    const result = await exportSourceCode(schema, {
      solution,
      materialPack: antdCodeGenPack,
      skipPublisher: true,
    });

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[codegen-server] 出码失败:", message);
    res.status(500).json({ success: false, message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "codegen-server" });
});

app.listen(PORT, () => {
  console.log(`[codegen-server] 运行在 http://localhost:${PORT}`);
  console.log(`[codegen-server] POST /api/codegen - 服务端出码`);
});
