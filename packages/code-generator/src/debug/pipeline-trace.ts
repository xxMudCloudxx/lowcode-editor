import {
  ProjectBuilder,
  type IGeneratedFile,
  type IMaterialCodeGenPack,
  type IProjectPlugin,
  type IRNode,
  type IRPage,
  type IRProject,
  type ISchema,
  type ISolution,
} from "@lowcode/schema";
import { camelCase, upperFirst } from "lodash-es";
import { SchemaParser } from "../parser/schema-parser";
import { CodeGenRegistry } from "../registry/codegen-registry";
import reactViteSolution from "../solutions/react-vite";
import vueViteSolution from "../solutions/vue-vite";

export interface ITraceStageSnapshot {
  id: string;
  label: string;
  kind: "schema" | "ir" | "files";
  summary: Record<string, unknown>;
  focus?: Record<string, unknown>;
  snapshot: unknown;
}

export interface ITracePipelineOptions {
  solution?: string | ISolution;
  materialPack?: IMaterialCodeGenPack;
}

export interface ITracePipelineResult {
  solution: string;
  stageOrder: string[];
  overview: {
    totalStages: number;
    finalFileCount: number;
    pageNames: string[];
  };
  output: {
    files: IGeneratedFile[];
  };
  stages: ITraceStageSnapshot[];
}

const solutionRegistry: Record<string, ISolution> = {
  "react-vite": reactViteSolution,
  "vue-vite": vueViteSolution,
};

function resolveSolution(input: string | ISolution = "react-vite"): ISolution {
  if (typeof input !== "string") {
    return input;
  }

  const solution = solutionRegistry[input];
  if (!solution) {
    throw new Error(
      `不支持的解决方案: ${input}。可用方案: ${Object.keys(solutionRegistry).join(", ")}`,
    );
  }

  return solution;
}

function sortProjectPlugins(plugins: ISolution["projectPlugins"]) {
  const pre: IProjectPlugin[] = [];
  const post: IProjectPlugin[] = [];

  for (const plugin of plugins) {
    if ((plugin.phase ?? "post") === "pre") {
      pre.push(plugin);
    } else {
      post.push(plugin);
    }
  }

  const byWeight = (a: (typeof pre)[number], b: (typeof pre)[number]) =>
    (a.weight ?? 100) - (b.weight ?? 100);

  pre.sort(byWeight);
  post.sort(byWeight);

  return { pre, post };
}

function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createFilesSnapshot(projectBuilder: ProjectBuilder) {
  return cloneSnapshot(projectBuilder.generateFiles());
}

function createModuleBuilderOrThrow(solution: ISolution) {
  if (!solution.createModuleBuilder) {
    throw new Error(
      `[traceCodegenPipeline] 解决方案 ${solution.name} 未提供 createModuleBuilder 实现。`,
    );
  }

  return solution.createModuleBuilder();
}

function collectNodeStats(node: IRNode): {
  nodeCount: number;
  actionCount: number;
  componentNames: string[];
} {
  const componentNames = new Set<string>();
  let nodeCount = 0;
  let actionCount = 0;

  const visitNode = (current: IRNode) => {
    nodeCount += 1;
    componentNames.add(current.componentName);

    for (const value of Object.values(current.props)) {
      if (Array.isArray(value)) {
        if (value.every((item) => item?.type === "Action")) {
          actionCount += value.length;
          continue;
        }

        for (const item of value) {
          if (item && typeof item === "object" && "componentName" in item) {
            visitNode(item as IRNode);
          }
        }
        continue;
      }

      if (value && typeof value === "object") {
        if ("type" in value && value.type === "Action") {
          actionCount += 1;
          continue;
        }

        if ("componentName" in value) {
          visitNode(value as IRNode);
        }
      }
    }

    current.children?.forEach(visitNode);
  };

  visitNode(node);

  return {
    nodeCount,
    actionCount,
    componentNames: Array.from(componentNames),
  };
}

function summarizeSchema(schema: ISchema) {
  const pageNames: string[] = [];
  let nodeCount = 0;

  const visitSchemaNode = (node: ISchema[number]) => {
    nodeCount += 1;
    node.children?.forEach(visitSchemaNode);
  };

  for (const page of schema) {
    pageNames.push(String(page.name));
    visitSchemaNode(page);
  }

  return {
    pageCount: schema.length,
    nodeCount,
    pageNames,
  };
}

function summarizeIr(irProject: IRProject) {
  let nodeCount = 0;
  let actionCount = 0;
  let stateCount = 0;
  let methodCount = 0;
  const componentNames = new Set<string>();
  const pageNames: string[] = [];

  const pages = irProject.pages.map((page) => {
    const stats = collectNodeStats(page.node);
    nodeCount += stats.nodeCount;
    actionCount += stats.actionCount;
    stateCount += Object.keys(page.states ?? {}).length;
    methodCount += Object.keys(page.methods ?? {}).length;
    stats.componentNames.forEach((name) => componentNames.add(name));
    pageNames.push(page.fileName);

    return {
      id: String(page.id),
      fileName: page.fileName,
      nodeCount: stats.nodeCount,
      actionCount: stats.actionCount,
      stateKeys: Object.keys(page.states ?? {}),
      methodKeys: Object.keys(page.methods ?? {}),
      components: stats.componentNames,
    };
  });

  return {
    pageCount: irProject.pages.length,
    nodeCount,
    actionCount,
    stateCount,
    methodCount,
    dependencyCount: Object.keys(irProject.dependencies ?? {}).length,
    components: Array.from(componentNames),
    pages,
  };
}

function summarizeFiles(files: IGeneratedFile[]) {
  const byType: Record<string, number> = {};
  for (const file of files) {
    byType[file.fileType] = (byType[file.fileType] ?? 0) + 1;
  }

  return {
    fileCount: files.length,
    filePaths: files.map((file) => file.filePath),
    byType,
  };
}

function diffFiles(
  previousFiles: IGeneratedFile[] | null,
  currentFiles: IGeneratedFile[],
) {
  const previousMap = new Map(
    (previousFiles ?? []).map((file) => [file.filePath, file]),
  );
  const added: string[] = [];
  const changed: string[] = [];

  for (const file of currentFiles) {
    const previous = previousMap.get(file.filePath);
    if (!previous) {
      added.push(file.filePath);
      continue;
    }

    if (previous.content !== file.content) {
      changed.push(file.filePath);
    }
  }

  return {
    added,
    changed,
  };
}

function summarizeStage(
  kind: ITraceStageSnapshot["kind"],
  snapshot: unknown,
  previousSnapshot: unknown,
) {
  if (kind === "schema") {
    return {
      summary: summarizeSchema(snapshot as ISchema),
      focus: undefined,
    };
  }

  if (kind === "ir") {
    const currentSummary = summarizeIr(snapshot as IRProject);
    const previousSummary =
      previousSnapshot && typeof previousSnapshot === "object"
        ? summarizeIr(previousSnapshot as IRProject)
        : null;

    return {
      summary: currentSummary,
      focus: {
        stateDelta:
          currentSummary.stateCount - (previousSummary?.stateCount ?? 0),
        methodDelta:
          currentSummary.methodCount - (previousSummary?.methodCount ?? 0),
        actionDelta:
          currentSummary.actionCount - (previousSummary?.actionCount ?? 0),
        pages: currentSummary.pages.map((page) => ({
          fileName: page.fileName,
          stateKeys: page.stateKeys,
          methodKeys: page.methodKeys,
        })),
      },
    };
  }

  const fileSummary = summarizeFiles(snapshot as IGeneratedFile[]);
  return {
    summary: fileSummary,
    focus: diffFiles(
      (previousSnapshot as IGeneratedFile[] | null) ?? null,
      snapshot as IGeneratedFile[],
    ),
  };
}

function createStageSnapshot(params: {
  id: string;
  label: string;
  kind: ITraceStageSnapshot["kind"];
  snapshot: unknown;
  previousSnapshot?: unknown;
}): ITraceStageSnapshot {
  const normalizedSnapshot = cloneSnapshot(params.snapshot);
  const normalizedPrevious = params.previousSnapshot
    ? cloneSnapshot(params.previousSnapshot)
    : undefined;
  const { summary, focus } = summarizeStage(
    params.kind,
    normalizedSnapshot,
    normalizedPrevious,
  );

  return {
    id: params.id,
    label: params.label,
    kind: params.kind,
    summary,
    focus,
    snapshot: normalizedSnapshot,
  };
}

function emitPageFiles(
  solution: ISolution,
  page: IRPage,
  projectBuilder: ProjectBuilder,
  registry: CodeGenRegistry,
) {
  const moduleBuilder = createModuleBuilderOrThrow(solution);

  solution.componentPlugins.forEach((plugin) => {
    plugin.run(page, moduleBuilder, projectBuilder, { registry });
  });

  const componentPascalName = upperFirst(camelCase(page.fileName));

  if (solution.emitPageFiles) {
    solution.emitPageFiles({
      page,
      moduleBuilder,
      projectBuilder,
      componentPascalName,
    });
    return;
  }

  const fileName = `${componentPascalName}.tsx`;
  const filePath = `src/pages/${componentPascalName}/${fileName}`;
  const content = moduleBuilder.generateModule(componentPascalName);
  projectBuilder.addFile({
    fileName,
    filePath,
    content,
    fileType: "tsx",
  });

  const cssContent = moduleBuilder.generateCssModule(componentPascalName);
  if (!cssContent) {
    return;
  }

  const cssFileName = `${componentPascalName}.module.scss`;
  const cssFilePath = `src/pages/${componentPascalName}/${cssFileName}`;
  projectBuilder.addFile({
    fileName: cssFileName,
    filePath: cssFilePath,
    content: cssContent,
    fileType: "scss",
  });
}

/**
 * 追踪完整的 code-generator 流水线，返回适合人工排查的阶段摘要和完整快照。
 *
 * 用法：
 * `const result = await traceCodegenPipeline(schema, { solution: "react-vite", materialPack })`
 *
 * 建议查看顺序：
 * 1. `result.stageOrder`
 * 2. `result.overview`
 * 3. `result.stages[i].summary`
 * 4. `result.stages[i].focus`
 * 5. `result.stages[i].snapshot`
 */
export async function traceCodegenPipeline(
  schema: ISchema,
  options: ITracePipelineOptions = {},
): Promise<ITracePipelineResult> {
  const solution = resolveSolution(options.solution);
  const registry = new CodeGenRegistry();
  if (options.materialPack) {
    registry.loadPack(options.materialPack);
  }

  const parser = new SchemaParser(registry);
  const stages: ITraceStageSnapshot[] = [
    createStageSnapshot({
      id: "input-schema",
      label: "输入 Schema",
      kind: "schema",
      snapshot: schema,
    }),
  ];

  let irProject: IRProject = parser.parse(schema);
  stages.push(
    createStageSnapshot({
      id: "raw-ir",
      label: "SchemaParser 输出 Raw IR",
      kind: "ir",
      snapshot: irProject,
    }),
  );

  if (solution.preprocessors) {
    for (const preprocessor of solution.preprocessors) {
      const previousIr = cloneSnapshot(irProject);
      irProject = preprocessor.run(irProject, { registry });
      stages.push(
        createStageSnapshot({
          id: `preprocessor:${preprocessor.name}`,
          label: `预处理器 ${preprocessor.name}`,
          kind: "ir",
          snapshot: irProject,
          previousSnapshot: previousIr,
        }),
      );
    }
  }

  const projectBuilder = new ProjectBuilder(irProject);

  for (const file of solution.template.getStaticFiles()) {
    projectBuilder.addFile(file);
  }
  stages.push(
    createStageSnapshot({
      id: "template:static-files",
      label: "注入模板静态文件",
      kind: "files",
      snapshot: createFilesSnapshot(projectBuilder),
    }),
  );

  const { pre: prePlugins, post: postPlugins } = sortProjectPlugins(
    solution.projectPlugins,
  );

  for (const plugin of prePlugins) {
    const previousFiles = createFilesSnapshot(projectBuilder);
    plugin.run(projectBuilder);
    stages.push(
      createStageSnapshot({
        id: `project-plugin:pre:${plugin.name}`,
        label: `项目插件 pre:${plugin.name}`,
        kind: "files",
        snapshot: createFilesSnapshot(projectBuilder),
        previousSnapshot: previousFiles,
      }),
    );
  }

  for (const page of irProject.pages) {
    const previousFiles = createFilesSnapshot(projectBuilder);
    emitPageFiles(solution, page, projectBuilder, registry);
    stages.push(
      createStageSnapshot({
        id: `component-emit:${page.fileName}`,
        label: `页面 ${page.fileName} 发射文件`,
        kind: "files",
        snapshot: createFilesSnapshot(projectBuilder),
        previousSnapshot: previousFiles,
      }),
    );
  }

  for (const plugin of postPlugins) {
    const previousFiles = createFilesSnapshot(projectBuilder);
    plugin.run(projectBuilder);
    stages.push(
      createStageSnapshot({
        id: `project-plugin:post:${plugin.name}`,
        label: `项目插件 post:${plugin.name}`,
        kind: "files",
        snapshot: createFilesSnapshot(projectBuilder),
        previousSnapshot: previousFiles,
      }),
    );
  }

  if (solution.postProcessors.length > 0) {
    const previousFiles = createFilesSnapshot(projectBuilder);
    await projectBuilder.applyPostProcessors(solution.postProcessors);
    stages.push(
      createStageSnapshot({
        id: "post-processors",
        label: "后处理器格式化",
        kind: "files",
        snapshot: createFilesSnapshot(projectBuilder),
        previousSnapshot: previousFiles,
      }),
    );
  }

  const files = projectBuilder.generateFiles();
  stages.push(
    createStageSnapshot({
      id: "final-output",
      label: "最终输出文件",
      kind: "files",
      snapshot: files,
      previousSnapshot:
        stages.length > 0 && stages[stages.length - 1].kind === "files"
          ? stages[stages.length - 1].snapshot
          : undefined,
    }),
  );

  return {
    solution: solution.name,
    stageOrder: stages.map((stage) => stage.id),
    overview: {
      totalStages: stages.length,
      finalFileCount: files.length,
      pageNames: irProject.pages.map((page) => page.fileName),
    },
    output: {
      files,
    },
    stages,
  };
}
