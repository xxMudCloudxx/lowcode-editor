import type {
  IProjectPlugin,
  ProjectBuilder,
  IRAction,
  IRNode,
  IRPage,
  IRPropValue,
} from "@lowcode/schema";

type SupportedRuntimeAction = "showMessage" | "goToLink" | "customJs";

const ACTION_NORMALIZER: Record<string, SupportedRuntimeAction | undefined> = {
  showMessage: "showMessage",
  goToLink: "goToLink",
  customJs: "customJs",
  customJS: "customJs",
};

function isIRNodeLike(value: unknown): value is IRNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "componentName" in value &&
    "props" in value &&
    "dependency" in value
  );
}

function collectRuntimeActions(builder: ProjectBuilder): SupportedRuntimeAction[] {
  const actionSet = new Set<SupportedRuntimeAction>();

  const visitPropValue = (value: IRPropValue) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "object" && item !== null && "type" in item) {
          if (item.type === "Action") {
            const normalizedAction = ACTION_NORMALIZER[item.actionType];
            if (normalizedAction) {
              actionSet.add(normalizedAction);
            }
            continue;
          }
        }

        if (isIRNodeLike(item)) {
          visitNode(item);
        }
      }
      return;
    }

    if (typeof value !== "object" || value === null) {
      return;
    }

    if ("type" in value) {
      if (value.type === "Action") {
        const normalizedAction = ACTION_NORMALIZER[value.actionType];
        if (normalizedAction) {
          actionSet.add(normalizedAction);
        }
      }
      return;
    }

    if (isIRNodeLike(value)) {
      visitNode(value);
    }
  };

  const visitNode = (node: IRNode) => {
    Object.values(node.props).forEach(visitPropValue);
    node.children?.forEach(visitNode);
  };

  builder
    .getIrProject()
    .pages.forEach((page: IRPage) => visitNode(page.node));

  return Array.from(actionSet).sort();
}

function getRuntimeContent(actions: SupportedRuntimeAction[]): string {
  const needsMessageApi = actions.includes("showMessage") || actions.includes("customJs");
  const includesShowMessage = actions.includes("showMessage");
  const includesGoToLink = actions.includes("goToLink");
  const includesCustomJs = actions.includes("customJs");

  const runtimeActionName = actions.map((action) => `'${action}'`).join(" | ");

  const payloadEntries = actions
    .map((action) => {
      switch (action) {
        case "showMessage":
          return `  showMessage: Omit<RunShowMessageOptions, 'message'>;`;
        case "goToLink":
          return `  goToLink: RunGoToLinkOptions;`;
        case "customJs":
          return `  customJs: Omit<RunCustomJsOptions, 'message'>;`;
      }
    })
    .join("\n");

  const registryEntries = actions
    .map((action) => {
      switch (action) {
        case "showMessage":
          return `  showMessage: (payload, context) =>
    runShowMessage({
      ...payload,
      message: context.message,
    }),`;
        case "goToLink":
          return `  goToLink: (payload) => runGoToLink(payload),`;
        case "customJs":
          return `  customJs: (payload, context) =>
    runCustomJs({
      ...payload,
      message: context.message,
    }),`;
      }
    })
    .join("\n");

  const parts: string[] = [];

  if (includesCustomJs) {
    parts.push(`export interface CustomJsContext {
  name: string;
  props: Record<string, unknown>;
}`);
  }

  if (needsMessageApi) {
    parts.push(`export interface CustomJsMessageApi {
  [key: string]: ((content: string) => void) | unknown;
}`);
  }

  if (includesCustomJs) {
    parts.push(`export interface RunCustomJsOptions {
  code: string;
  context: CustomJsContext;
  args: unknown[];
  message: CustomJsMessageApi;
}`);
  }

  if (includesShowMessage || includesCustomJs) {
    parts.push(`export interface RunShowMessageOptions {
  message: CustomJsMessageApi;
  type?: string;
  text?: string;
}`);
  }

  if (includesGoToLink) {
    parts.push(`export interface RunGoToLinkOptions {
  url?: string;
  target?: string;
}`);
  }

  parts.push(`export type RuntimeActionName = ${runtimeActionName};`);

  parts.push(`export interface RuntimeActionPayloadMap {
${payloadEntries}
}`);

  parts.push(`export interface RuntimeActionContext {
  message${needsMessageApi ? "" : "?"}: ${needsMessageApi ? "CustomJsMessageApi" : "Record<string, unknown>"};
}`);

  if (includesShowMessage || includesCustomJs) {
    parts.push(`export function runShowMessage({
  message,
  type = 'info',
  text = '',
}: RunShowMessageOptions) {
  const messageType =
    typeof type === 'string' && typeof message[type] === 'function'
      ? type
      : 'info';
  const normalizedText = typeof text === 'string' ? text : String(text ?? '');
  const showMessage = message[messageType];

  if (typeof showMessage === 'function') {
    return showMessage(normalizedText);
  }

  return undefined;
}`);
  }

  if (includesGoToLink) {
    parts.push(`export function runGoToLink({
  url,
  target = '_blank',
}: RunGoToLinkOptions) {
  if (!url) {
    return undefined;
  }

  return window.open(url, target, 'noopener,noreferrer');
}`);
  }

  if (includesCustomJs) {
    parts.push(`export function runCustomJs({
  code,
  context,
  args,
  message,
}: RunCustomJsOptions) {
  try {
    const runner = new Function('ShowMessage', 'context', 'args', code);
    return runner(
      (content: unknown, type = 'success') =>
        runShowMessage({
          message,
          type,
          text: typeof content === 'string' ? content : String(content ?? ''),
        }),
      context,
      args
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error ?? 'Unknown error');
    console.error('[customJs] execute failed:', error);

    const showError = message.error;
    if (typeof showError === 'function') {
      showError(errorMessage);
    }

    return undefined;
  }
}`);
  }

  parts.push(`const actionRegistry: {
  [K in RuntimeActionName]: (
    payload: RuntimeActionPayloadMap[K],
    context: RuntimeActionContext
  ) => unknown;
} = {
${registryEntries}
};`);

  parts.push(`export function runAction<K extends RuntimeActionName>(
  actionName: K,
  payload: RuntimeActionPayloadMap[K],
  context: RuntimeActionContext
) {
  const executor = actionRegistry[actionName];

  if (!executor) {
    console.warn('[runtime] unknown action:', actionName);
    return undefined;
  }

  return executor(payload, context);
}`);

  return `${parts.join("\n\n")}\n`;
}

export function createCustomJsRuntimePlugin(name: string): IProjectPlugin {
  return {
    type: "project",
    name,
    run: (builder: ProjectBuilder) => {
      const actions = collectRuntimeActions(builder);
      if (actions.length === 0) {
        return;
      }

      builder.addFile({
        fileName: "actions.ts",
        filePath: "src/runtime/actions.ts",
        fileType: "ts",
        content: getRuntimeContent(actions),
      });
    },
  };
}
