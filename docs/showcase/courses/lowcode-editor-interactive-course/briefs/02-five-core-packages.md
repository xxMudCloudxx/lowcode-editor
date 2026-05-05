## Teaching Arc

- Opening hook: “面试官问你这个低代码平台是怎么分层的，如果你只会说 editor、renderer、codegen 三个词，答案还不够。”
- Metaphor: 像一个五人小组接力做事。有人定义规则，有人准备零件，有人负责舞台，有人负责现场表演，有人负责把结果打包成成品。
- Why this matters in an interview: 这模块帮读者形成一个可复述的架构地图，后面不管被追问拖拽、渲染还是出码，都知道该落到哪个包上。

## Code Evidence

- `packages/materials/src/index.tsx:87-111`

```tsx
const mergedMaterials: ComponentConfig[] = manualList.map((man) => {
  const generatedMeta = generatedMetaMap.get(man.name);

  // 濡傛灉鎵嬪姩 meta 娌″啓 setter 鎴?events锛屼粠鑷姩鐢熸垚鐨勮ˉ鍏?
  const needsMerge =
    !man.setter ||
    man.setter.length === 0 ||
    !man.events ||
    man.events.length === 0;

  if (needsMerge && generatedMeta) {
    return {
      ...man,
```

- `packages/materials/src/codegen.ts:141-148`

```ts
export const antdCodeGenPack: IMaterialCodeGenPack = {
  descriptors: antdCodeGenDescriptors,
  customLogic: {
    Icon: iconCustomLogic,
    Table: tableCustomLogic,
    FormItem: formItemCustomLogic,
  },
};
```

- `packages/code-generator/src/index.ts:169-182`

```ts
  try {
    // --- 0. 瑙ｆ瀽 Solution ---
    const solution = resolveSolution(solutionInput);
    console.log(`[CodeGenerator] 寮€濮嬫墽琛屽嚭鐮侊紝浣跨敤瑙ｅ喅鏂规: ${solution.name}`);

    // --- 0.5 鍒濆鍖?CodeGenRegistry ---
    const registry = new CodeGenRegistry();
    if (materialPack) {
      registry.loadPack(materialPack);
    }

    // --- 1. Schema 鈫?IR ---
    const parser = new SchemaParser(registry);
    let irProject = parser.parse(schema);
```

- `packages/code-generator/src/solutions/react-vite.ts:37-58`

```ts
const reactViteSolution: ISolution = {
  name: "react-vite",
  description: "鍩轰簬 React 18 + Vite 5 + TypeScript 鐨勬爣鍑?SPA 椤圭洰",

  template: reactViteTemplate,

  preprocessors: [stateLifterPreprocessor],

  componentPlugins: [cssPlugin, jsxPlugin],

  projectPlugins: [
    { ...globalStylePlugin, phase: "post" as const, weight: 10 },
```

## Interactive Elements

- Hero visual: 五个包的角色卡片，每张卡只有一句“职责 + 为什么不能混在别的包里”。
- Group chat animation: `schema` 先说“我定义数据结构”，`materials` 说“我提供物料协议”，`renderer` 说“我负责把树变成界面”，`editor` 说“我负责工作台”，`code-generator` 说“我负责变成真实项目”。
- Quiz type: scenario quiz，题目是“如果你要新增一个物料并支持 React/Vue 出码，应该先改哪个包，为什么？”
- Code-to-English block target: `packages/code-generator/src/index.ts:169-182`。

## References To Load While Writing

- `interactive-elements.md`
  Focus: Group Chat Animation, Pattern Cards, Scenario Quiz, Visual File Tree.
- `content-philosophy.md`
  Focus: Show, Don't Tell; Convert text to visuals.
- `design-system.md`
  Focus: Actor colors, Pattern/Feature Cards.

## Transition

- Previous module: 读者已经知道产品长什么样。
- Next module: 进入第一条关键链路，解释左边物料为什么真的能进到中间画布里。
