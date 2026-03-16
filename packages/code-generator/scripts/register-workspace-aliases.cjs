const Module = require("module");
const path = require("path");

const aliasEntries = {
  "@lowcode/schema": path.resolve(__dirname, "../../schema/src/index.ts"),
};

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolveFilename(
  request,
  parent,
  isMain,
  options,
) {
  if (Object.prototype.hasOwnProperty.call(aliasEntries, request)) {
    return aliasEntries[request];
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
