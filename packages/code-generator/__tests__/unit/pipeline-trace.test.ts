import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("parse-with-stages snapshot", () => {
  it("should match the committed output and total snapshots for scripts/input.json", () => {
    const fixturesDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "./__snap__/parse-with-stages",
    );
    const expectedOutput = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, "output.json"), "utf-8"),
    );
    const expectedTotal = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, "total.json"), "utf-8"),
    );
    const packageRoot = path.resolve(fixturesDir, "../../../..");
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codegen-trace-"));
    const tempOutputPath = path.join(tempDir, "output.json");
    const tempTotalPath = path.join(tempDir, "total.json");
    const tsxPath = require.resolve("tsx/cli", {
      paths: [packageRoot],
    });
    const scriptPath = path.join(packageRoot, "scripts/parse-with-stages.ts");
    const inputPath = path.join(packageRoot, "scripts/input.json");
    const aliasBootstrapPath = path.join(
      packageRoot,
      "scripts/register-workspace-aliases.cjs",
    );
    const nodeOptions = [
      process.env.NODE_OPTIONS,
      `--require=${aliasBootstrapPath}`,
    ]
      .filter(Boolean)
      .join(" ");

    execFileSync(
      process.execPath,
      [tsxPath, scriptPath, inputPath, tempOutputPath, tempTotalPath],
      {
        cwd: packageRoot,
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions,
        },
        stdio: "pipe",
      },
    );

    const actualOutput = JSON.parse(fs.readFileSync(tempOutputPath, "utf-8"));
    const actualTotal = JSON.parse(fs.readFileSync(tempTotalPath, "utf-8"));

    expect(actualOutput).toEqual(expectedOutput);
    expect(actualTotal).toEqual(expectedTotal);
  });
});
