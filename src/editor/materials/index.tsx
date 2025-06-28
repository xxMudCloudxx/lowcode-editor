import { lazy } from "react";
import type { ComponentConfig } from "../stores/component-config";
import buttonMeta from "./Button/meta";
import containerMeta from "./Container/meta";
import formMeta from "./Form/meta";
import formItemMeta from "./FormItem/meta";
import modalMeta from "./Modal/meta";
import pageMeta from "./Page/meta";
import tableMeta from "./Table/meta";
import tableColumnMeta from "./TableColumn/meta";

export const materials: ComponentConfig[] = [
  {
    ...buttonMeta,
    dev: lazy(() => import("./Button/dev")),
    prod: lazy(() => import("./Button/prod")),
  },
  {
    ...containerMeta,
    dev: lazy(() => import("./Container/dev")),
    prod: lazy(() => import("./Container/prod")),
  },
  {
    ...formMeta,
    dev: lazy(() => import("./Form/dev")),
    prod: lazy(() => import("./Form/prod")),
  },
  {
    ...formItemMeta,
    dev: lazy(() => import("./FormItem/dev")),
    prod: lazy(() => import("./FormItem/prod")),
  },
  {
    ...modalMeta,
    dev: lazy(() => import("./Modal/dev")),
    prod: lazy(() => import("./Modal/prod")),
  },
  {
    ...pageMeta,
    dev: lazy(() => import("./Page/dev")),
    prod: lazy(() => import("./Page/prod")),
  },
  {
    ...tableMeta,
    dev: lazy(() => import("./Table/dev")),
    prod: lazy(() => import("./Table/prod")),
  },
  {
    ...tableColumnMeta,
    dev: lazy(() => import("./TableColumn/dev")),
    prod: lazy(() => import("./TableColumn/prod")),
  },
];
