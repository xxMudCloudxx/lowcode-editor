import { createCustomJsRuntimePlugin } from "../shared/actions-runtime.ts";

const customJsRuntimePlugin = createCustomJsRuntimePlugin(
  "vue-custom-js-runtime",
);

export default customJsRuntimePlugin;
