import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

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
    const tsxPath = path.resolve(packageRoot, "node_modules/.bin/tsx.CMD");
    const scriptPath = path.join(packageRoot, "scripts/parse-with-stages.ts");
    const inputPath = path.join(packageRoot, "scripts/input.json");
    const psQuote = (value: string) => `'${value.replace(/'/g, "''")}'`;

    execFileSync(
      "powershell.exe",
      [
        "-Command",
        `& ${psQuote(tsxPath)} ${psQuote(scriptPath)} ${psQuote(inputPath)} ${psQuote(tempOutputPath)} ${psQuote(tempTotalPath)}`,
      ],
      {
        cwd: packageRoot,
        stdio: "pipe",
      },
    );

    const actualOutput = JSON.parse(fs.readFileSync(tempOutputPath, "utf-8"));
    const actualTotal = JSON.parse(fs.readFileSync(tempTotalPath, "utf-8"));

    expect(actualOutput).toEqual(expectedOutput);
    expect(actualTotal).toEqual(expectedTotal);
  });
});
