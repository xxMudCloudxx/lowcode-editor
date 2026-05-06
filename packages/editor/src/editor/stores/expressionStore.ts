import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { ExpressionContext } from "@lowcode/expression";
import type { DataSourceConfig, VariableDefinition } from "@lowcode/schema";

interface ExpressionState {
  globalVariables: VariableDefinition[];
  pageVariables: VariableDefinition[];
  globalValues: Record<string, unknown>;
  pageValues: Record<string, unknown>;
  dataValues: Record<string, unknown>;
  systemValues: Record<string, unknown>;
  dataSources: DataSourceConfig[];
}

interface ExpressionActions {
  setGlobalVariable: (name: string, value: unknown) => void;
  setPageVariable: (name: string, value: unknown) => void;
  addVariable: (scope: "global" | "page", def: VariableDefinition) => void;
  removeVariable: (scope: "global" | "page", name: string) => void;
  addDataSource: (config: DataSourceConfig) => void;
  removeDataSource: (id: string) => void;
  updateDataSource: (id: string, config: Partial<DataSourceConfig>) => void;
  fetchDataSource: (id: string) => Promise<void>;
  fetchAllAutoDataSources: () => Promise<void>;
  buildContext: (componentProps?: Record<string, unknown>) => ExpressionContext;
}

export type ExpressionStore = ExpressionState & ExpressionActions;

function buildSystemValues(): Record<string, unknown> {
  if (typeof window === "undefined") {
    return {
      timestamp: Date.now(),
      date: new Date().toISOString().split("T")[0],
      url: "",
      pathname: "",
      search: {},
    };
  }

  return {
    timestamp: Date.now(),
    date: new Date().toISOString().split("T")[0],
    url: window.location.href,
    pathname: window.location.pathname,
    search: Object.fromEntries(new URLSearchParams(window.location.search)),
  };
}

export function createInitialExpressionState(): ExpressionState {
  return {
    globalVariables: [],
    pageVariables: [],
    globalValues: {},
    pageValues: {},
    dataValues: {},
    systemValues: buildSystemValues(),
    dataSources: [],
  };
}

function withDefaultValue(
  values: Record<string, unknown>,
  def: VariableDefinition,
): Record<string, unknown> {
  if (Object.prototype.hasOwnProperty.call(values, def.name)) {
    return values;
  }

  return {
    ...values,
    [def.name]: def.defaultValue,
  };
}

function buildRequestUrl(ds: DataSourceConfig): string {
  if (ds.method !== "GET" || !ds.params || Object.keys(ds.params).length === 0) {
    return ds.url;
  }

  const url = new URL(ds.url, window.location.origin);
  for (const [key, value] of Object.entries(ds.params)) {
    if (value == null) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export const useExpressionStore = create<ExpressionStore>()(
  persist(
    immer((set, get) => ({
      ...createInitialExpressionState(),

      setGlobalVariable: (name, value) => {
        set((state) => {
          state.globalValues[name] = value;
        });
      },

      setPageVariable: (name, value) => {
        set((state) => {
          state.pageValues[name] = value;
        });
      },

      addVariable: (scope, def) => {
        set((state) => {
          const definitions =
            scope === "global" ? state.globalVariables : state.pageVariables;
          const values =
            scope === "global" ? state.globalValues : state.pageValues;
          const existingIndex = definitions.findIndex(
            (item) => item.name === def.name,
          );

          if (existingIndex >= 0) {
            definitions[existingIndex] = def;
          } else {
            definitions.push(def);
          }

          if (!Object.prototype.hasOwnProperty.call(values, def.name)) {
            values[def.name] = def.defaultValue;
          }
        });
      },

      removeVariable: (scope, name) => {
        set((state) => {
          if (scope === "global") {
            state.globalVariables = state.globalVariables.filter(
              (item) => item.name !== name,
            );
            delete state.globalValues[name];
            return;
          }

          state.pageVariables = state.pageVariables.filter(
            (item) => item.name !== name,
          );
          delete state.pageValues[name];
        });
      },

      addDataSource: (config) => {
        set((state) => {
          const existingIndex = state.dataSources.findIndex(
            (item) => item.id === config.id,
          );
          if (existingIndex >= 0) {
            state.dataSources[existingIndex] = config;
            return;
          }

          state.dataSources.push(config);
        });
      },

      removeDataSource: (id) => {
        set((state) => {
          const dataSource = state.dataSources.find((item) => item.id === id);
          state.dataSources = state.dataSources.filter((item) => item.id !== id);
          if (dataSource) {
            delete state.dataValues[dataSource.name];
          }
        });
      },

      updateDataSource: (id, config) => {
        set((state) => {
          const index = state.dataSources.findIndex((item) => item.id === id);
          if (index < 0) return;
          state.dataSources[index] = {
            ...state.dataSources[index],
            ...config,
          };
        });
      },

      fetchDataSource: async (id) => {
        const ds = get().dataSources.find((item) => item.id === id);
        if (!ds) return;

        try {
          const response = await fetch(buildRequestUrl(ds), {
            method: ds.method,
            headers: { "Content-Type": "application/json" },
            body:
              ds.method === "POST" && ds.params
                ? JSON.stringify(ds.params)
                : undefined,
          });
          const data = await response.json();

          set((state) => {
            state.dataValues[ds.name] = data;
          });
        } catch (error) {
          set((state) => {
            state.dataValues[ds.name] = {
              __error:
                error instanceof Error ? error.message : String(error),
            };
          });
        }
      },

      fetchAllAutoDataSources: async () => {
        const autoDataSources = get().dataSources.filter((item) => item.autoFetch);
        await Promise.all(
          autoDataSources.map((item) => get().fetchDataSource(item.id)),
        );
      },

      buildContext: (componentProps = {}) => {
        const state = get();
        const systemValues = buildSystemValues();

        return {
          $global: state.globalValues,
          $page: state.pageValues,
          $data: state.dataValues,
          $props: componentProps,
          $system: systemValues,
        };
      },
    })),
    {
      name: "lowcode-expression-store",
      partialize: (state) => ({
        globalVariables: state.globalVariables,
        pageVariables: state.pageVariables,
        globalValues: state.globalValues,
        pageValues: state.pageValues,
        dataSources: state.dataSources,
      }),
      merge: (persistedState, currentState) => {
        const nextState = {
          ...currentState,
          ...(persistedState as Partial<ExpressionState>),
        } as ExpressionState;

        return {
          ...currentState,
          ...nextState,
          globalValues: nextState.globalVariables.reduce(
            (acc, def) => withDefaultValue(acc, def),
            nextState.globalValues,
          ),
          pageValues: nextState.pageVariables.reduce(
            (acc, def) => withDefaultValue(acc, def),
            nextState.pageValues,
          ),
          dataValues: currentState.dataValues,
          systemValues: buildSystemValues(),
        };
      },
    },
  ),
);
