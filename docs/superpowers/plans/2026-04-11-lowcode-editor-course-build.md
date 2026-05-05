# lowcode-editor Interactive Course Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese interactive course for the current `lowcode-editor` monorepo that explains the project through an interview-oriented lens and outputs a directly openable `index.html`.

**Architecture:** The course will live under `docs/courses/lowcode-editor-interactive-course/`, reuse the installed `codebase-to-course` reference shell verbatim, and add custom module HTML based on local code evidence. The module emphasis will follow the approved spec plus the user's resume highlights, especially cross-framework code generation, material codegen registration, Web Worker cancellation, and iframe sandbox synchronization.

**Tech Stack:** HTML, CSS, vanilla JS shell from `codebase-to-course`, local repository code snippets from `packages/editor`, `packages/code-generator`, `packages/materials`, `packages/renderer`, and shell-based build verification with `bash`.

---

## File Structure

- Create: `docs/courses/lowcode-editor-interactive-course/styles.css`
  Responsibility: shared visual system copied from skill references.
- Create: `docs/courses/lowcode-editor-interactive-course/main.js`
  Responsibility: shared interactivity runtime copied from skill references.
- Create: `docs/courses/lowcode-editor-interactive-course/_base.html`
  Responsibility: course shell with title, accent colors, and nav dots.
- Create: `docs/courses/lowcode-editor-interactive-course/_footer.html`
  Responsibility: shared footer copied from skill references.
- Create: `docs/courses/lowcode-editor-interactive-course/build.sh`
  Responsibility: assemble module HTML into final `index.html`.
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/01-*.md` through `06-*.md`
  Responsibility: module briefs with extracted snippets and interaction instructions.
- Create: `docs/courses/lowcode-editor-interactive-course/modules/01-*.html` through `06-*.html`
  Responsibility: actual course content sections.
- Create: `docs/courses/lowcode-editor-interactive-course/index.html`
  Responsibility: assembled final deliverable produced by `build.sh`.
- Reference: `docs/superpowers/specs/2026-04-11-lowcode-editor-course-design.md`
  Responsibility: approved design contract.

### Task 1: Freeze Inputs And Course Skeleton

**Files:**
- Create: `docs/courses/lowcode-editor-interactive-course/`
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/`
- Create: `docs/courses/lowcode-editor-interactive-course/modules/`
- Reference: `docs/superpowers/specs/2026-04-11-lowcode-editor-course-design.md`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/_base.html`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/build.sh`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/styles.css`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/main.js`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/_footer.html`

- [ ] **Step 1: Verify the approved spec exists**

Run: `Test-Path 'docs/superpowers/specs/2026-04-11-lowcode-editor-course-design.md'`
Expected: `True`

- [ ] **Step 2: Create the course directories**

Run: `New-Item -ItemType Directory -Force 'docs/courses/lowcode-editor-interactive-course','docs/courses/lowcode-editor-interactive-course/briefs','docs/courses/lowcode-editor-interactive-course/modules' | Out-Null`
Expected: no error output

- [ ] **Step 3: Copy the shared shell assets verbatim**

Run:

```powershell
Copy-Item 'C:/Users/27956/.codex/skills/codebase-to-course/references/styles.css' 'docs/courses/lowcode-editor-interactive-course/styles.css' -Force
Copy-Item 'C:/Users/27956/.codex/skills/codebase-to-course/references/main.js' 'docs/courses/lowcode-editor-interactive-course/main.js' -Force
Copy-Item 'C:/Users/27956/.codex/skills/codebase-to-course/references/_footer.html' 'docs/courses/lowcode-editor-interactive-course/_footer.html' -Force
Copy-Item 'C:/Users/27956/.codex/skills/codebase-to-course/references/build.sh' 'docs/courses/lowcode-editor-interactive-course/build.sh' -Force
```

Expected: four files exist under `docs/courses/lowcode-editor-interactive-course/`

- [ ] **Step 4: Confirm copied assets are present**

Run: `Get-ChildItem 'docs/courses/lowcode-editor-interactive-course' | Select-Object Name`
Expected: includes `styles.css`, `main.js`, `_footer.html`, `build.sh`, `briefs`, `modules`

- [ ] **Step 5: Commit the shell setup**

```bash
git add -f docs/courses/lowcode-editor-interactive-course
git commit -m "docs: scaffold interactive course shell"
```

### Task 2: Extract Evidence And Write Module Briefs

**Files:**
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/01-product-and-demo-flow.md`
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/02-five-core-packages.md`
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/03-drag-drop-to-render.md`
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/04-iframe-sandbox-and-sync.md`
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/05-cross-framework-codegen-pipeline.md`
- Create: `docs/courses/lowcode-editor-interactive-course/briefs/06-interview-story-and-highlights.md`
- Reference: `packages/materials/src/index.tsx`
- Reference: `packages/materials/src/codegen.ts`
- Reference: `packages/editor/src/editor/components/MaterialWrapper/Material/MaterialItem/index.tsx`
- Reference: `packages/editor/src/renderer/hooks/useDelegatedDnD.ts`
- Reference: `packages/editor/src/editor/stores/components.tsx`
- Reference: `packages/editor/src/editor/simulator/SimulatorHost.ts`
- Reference: `packages/editor/src/editor/simulator/SimulatorRenderer.ts`
- Reference: `packages/editor/src/editor/utils/codegenWorkerClient.ts`
- Reference: `packages/editor/src/editor/workers/codegen.worker.ts`
- Reference: `packages/code-generator/src/index.ts`
- Reference: `packages/code-generator/src/parser/schema-parser.ts`
- Reference: `packages/code-generator/src/registry/codegen-registry.ts`
- Reference: `packages/code-generator/src/solutions/react-vite.ts`
- Reference: `packages/code-generator/src/solutions/vue-vite.ts`
- Reference: `packages/renderer/src/SchemaRenderer.tsx`

- [ ] **Step 1: Capture line-numbered evidence for the drag, iframe, and codegen flows**

Run:

```powershell
$files = @(
  'packages/materials/src/index.tsx',
  'packages/materials/src/codegen.ts',
  'packages/editor/src/editor/components/MaterialWrapper/Material/MaterialItem/index.tsx',
  'packages/editor/src/renderer/hooks/useDelegatedDnD.ts',
  'packages/editor/src/editor/stores/components.tsx',
  'packages/editor/src/editor/simulator/SimulatorHost.ts',
  'packages/editor/src/editor/simulator/SimulatorRenderer.ts',
  'packages/editor/src/editor/utils/codegenWorkerClient.ts',
  'packages/editor/src/editor/workers/codegen.worker.ts',
  'packages/code-generator/src/index.ts',
  'packages/code-generator/src/parser/schema-parser.ts',
  'packages/code-generator/src/registry/codegen-registry.ts',
  'packages/code-generator/src/solutions/react-vite.ts',
  'packages/code-generator/src/solutions/vue-vite.ts',
  'packages/renderer/src/SchemaRenderer.tsx'
)
foreach ($file in $files) { Write-Output \"`n### $file\"; $i=1; Get-Content $file | ForEach-Object { \"{0,4}: {1}\" -f $i, $_; $i++ } }
```

Expected: line-numbered output for all evidence files

- [ ] **Step 2: Write the six module briefs with the interview emphasis**

Each brief must include:

```markdown
## Teaching Arc
- Opening hook
- Metaphor
- Why this matters in an interview

## Code Evidence
- Exact file path and line references
- 2-4 pasted snippets

## Interactive Elements
- Quiz type
- Chat or flow animation details
- Code-to-English block target

## Transition
- What previous module covered
- What next module will cover
```

Expected: six markdown files exist in `briefs/`

- [ ] **Step 3: Ensure the resume-highlight modules get priority**

Check that:
- module 4 brief explicitly mentions `READY` handshake, message queue, patch batching, chunking, and WAL replay
- module 5 brief explicitly mentions `Schema -> IR -> Solution -> Plugins -> Publisher`
- module 6 brief explicitly converts those into interview wording

Expected: all three emphases are present in the briefs

- [ ] **Step 4: Commit the briefs**

```bash
git add -f docs/courses/lowcode-editor-interactive-course/briefs
git commit -m "docs: add lowcode course module briefs"
```

### Task 3: Customize The Course Shell

**Files:**
- Create: `docs/courses/lowcode-editor-interactive-course/_base.html`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/_base.html`

- [ ] **Step 1: Read the reference base shell**

Run: `Get-Content -Raw 'C:/Users/27956/.codex/skills/codebase-to-course/references/_base.html'`
Expected: contains `COURSE_TITLE`, `ACCENT_*`, and `NAV_DOTS` placeholders

- [ ] **Step 2: Write the customized shell**

Use these substitutions:

```text
COURSE_TITLE => 从拖拽到出码：吃透 lowcode-editor 的架构与面试表达
ACCENT_PRIMARY => #d9481c
ACCENT_SECONDARY => #f97316
ACCENT_SOFT => #fed7aa
ACCENT_DEEP => #9a3412
NAV_DOTS => 6 nav buttons matching modules 1-6
```

Expected: `_base.html` contains no remaining placeholder tokens

- [ ] **Step 3: Verify the nav dots count**

Run: `Select-String -Path 'docs/courses/lowcode-editor-interactive-course/_base.html' -Pattern 'nav-dot' | Measure-Object`
Expected: `Count` equals `6`

- [ ] **Step 4: Commit the shell customization**

```bash
git add -f docs/courses/lowcode-editor-interactive-course/_base.html
git commit -m "docs: customize lowcode course shell"
```

### Task 4: Write Modules 1-3

**Files:**
- Create: `docs/courses/lowcode-editor-interactive-course/modules/01-what-this-platform-does.html`
- Create: `docs/courses/lowcode-editor-interactive-course/modules/02-five-core-actors.html`
- Create: `docs/courses/lowcode-editor-interactive-course/modules/03-drag-drop-to-render.html`
- Reference: `docs/courses/lowcode-editor-interactive-course/briefs/01-product-and-demo-flow.md`
- Reference: `docs/courses/lowcode-editor-interactive-course/briefs/02-five-core-packages.md`
- Reference: `docs/courses/lowcode-editor-interactive-course/briefs/03-drag-drop-to-render.md`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/content-philosophy.md`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/design-system.md`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/interactive-elements.md`
- Reference: `C:/Users/27956/.codex/skills/codebase-to-course/references/gotchas.md`

- [ ] **Step 1: Load the writing references**

Run:

```powershell
Get-Content -Raw 'C:/Users/27956/.codex/skills/codebase-to-course/references/content-philosophy.md'
Get-Content -Raw 'C:/Users/27956/.codex/skills/codebase-to-course/references/design-system.md'
Get-Content -Raw 'C:/Users/27956/.codex/skills/codebase-to-course/references/interactive-elements.md'
Get-Content -Raw 'C:/Users/27956/.codex/skills/codebase-to-course/references/gotchas.md'
```

Expected: local reference text is available for writing

- [ ] **Step 2: Write module 1 as the product and interview entry point**

Module 1 must include:

```html
<section class="module" id="module-1">
  <!-- intro hook -->
  <!-- one code-to-English translation block -->
  <!-- one multiple-choice quiz -->
</section>
```

Content requirements:
- explain what a schema-driven low-code platform is in plain Chinese
- contrast “component library” vs “platform”
- introduce the end-to-end user action

- [ ] **Step 3: Write module 2 around the five packages**

Module 2 must include:
- one group-chat animation between `editor`, `schema`, `materials`, `renderer`, `code-generator`
- one code-to-English block grounded in package responsibilities
- one quiz about layering and dependency boundaries

- [ ] **Step 4: Write module 3 around drag-and-drop to render**

Module 3 must include:
- one flow animation for `material panel -> iframe canvas -> store -> renderer`
- one code-to-English block for delegated DnD or normalized store updates
- one quiz about why normalized state and parentTypes matter

- [ ] **Step 5: Commit modules 1-3**

```bash
git add -f docs/courses/lowcode-editor-interactive-course/modules/01-what-this-platform-does.html docs/courses/lowcode-editor-interactive-course/modules/02-five-core-actors.html docs/courses/lowcode-editor-interactive-course/modules/03-drag-drop-to-render.html
git commit -m "docs: add first half of lowcode interactive course"
```

### Task 5: Write Modules 4-6

**Files:**
- Create: `docs/courses/lowcode-editor-interactive-course/modules/04-iframe-sandbox-and-sync.html`
- Create: `docs/courses/lowcode-editor-interactive-course/modules/05-cross-framework-codegen.html`
- Create: `docs/courses/lowcode-editor-interactive-course/modules/06-interview-answer-kit.html`
- Reference: `docs/courses/lowcode-editor-interactive-course/briefs/04-iframe-sandbox-and-sync.md`
- Reference: `docs/courses/lowcode-editor-interactive-course/briefs/05-cross-framework-codegen-pipeline.md`
- Reference: `docs/courses/lowcode-editor-interactive-course/briefs/06-interview-story-and-highlights.md`

- [ ] **Step 1: Write module 4 around iframe isolation and synchronization**

Module 4 must include:
- `READY` handshake explanation
- offline message queue explanation
- patch batching explanation
- chunked full-snapshot transfer explanation
- WAL replay as the recovery highlight
- one scenario quiz about why iframe sync is hard

- [ ] **Step 2: Write module 5 around cross-framework code generation**

Module 5 must include:
- `Schema -> IR -> Solution -> ProjectBuilder -> Publisher` flow animation
- one code-to-English block for `exportSourceCode`
- one code-to-English block for `CodeGenRegistry` or `antdCodeGenPack`
- one quiz about why the team chose IR plus Solution instead of direct JSX generation

- [ ] **Step 3: Write module 6 as the interview answer kit**

Module 6 must include:
- a short project pitch
- 3-4 high-signal bullet answers derived from the user’s resume wording
- follow-up question prompts such as “why use Worker” and “why use iframe”
- one quiz that simulates interviewer follow-up

- [ ] **Step 4: Confirm every module has the required backbone elements**

Run manual checklist:
- 6 modules total
- every module has at least one quiz
- every module has at least one code-to-English block
- course contains at least one group-chat animation
- course contains at least two flow animations

Expected: all boxes checked

- [ ] **Step 5: Commit modules 4-6**

```bash
git add -f docs/courses/lowcode-editor-interactive-course/modules/04-iframe-sandbox-and-sync.html docs/courses/lowcode-editor-interactive-course/modules/05-cross-framework-codegen.html docs/courses/lowcode-editor-interactive-course/modules/06-interview-answer-kit.html
git commit -m "docs: add second half of lowcode interactive course"
```

### Task 6: Assemble And Verify The Final Course

**Files:**
- Build: `docs/courses/lowcode-editor-interactive-course/index.html`
- Verify: `docs/courses/lowcode-editor-interactive-course/index.html`

- [ ] **Step 1: Run the assembly script**

Run: `bash build.sh`
Workdir: `docs/courses/lowcode-editor-interactive-course`
Expected: `index.html` is generated with no shell errors

- [ ] **Step 2: Verify the final file exists**

Run: `Test-Path 'docs/courses/lowcode-editor-interactive-course/index.html'`
Expected: `True`

- [ ] **Step 3: Sanity-check key strings in the final HTML**

Run:

```powershell
Select-String -Path 'docs/courses/lowcode-editor-interactive-course/index.html' -Pattern 'module-1','module-6','READY','Schema','IR','Web Worker','iframe'
```

Expected: matches include module anchors and key interview topics

- [ ] **Step 4: Run a final file inventory**

Run: `Get-ChildItem -Recurse 'docs/courses/lowcode-editor-interactive-course' | Select-Object FullName`
Expected: shell files, six briefs, six modules, and `index.html` are all present

- [ ] **Step 5: Commit the built course**

```bash
git add -f docs/courses/lowcode-editor-interactive-course
git commit -m "docs: build lowcode interactive course"
```

## Self-Review

### Spec coverage

- Module count: covered by Tasks 4-5.
- Output directory and build: covered by Tasks 1, 3, and 6.
- Drag/drop, materials, renderer, state, codegen: covered by Tasks 2, 4, and 5.
- Interview-oriented emphasis and resume highlights: covered by Tasks 2 and 5.
- Interactive requirements: covered by Tasks 4 and 5.

### Placeholder scan

- No `TODO`, `TBD`, or “similar to above” placeholders remain.
- Every task includes exact paths and concrete commands.

### Type consistency

- Course directory path is consistently `docs/courses/lowcode-editor-interactive-course/`.
- Module numbering is consistently `01` through `06`.
- Resume-highlight topics consistently map to module 4, module 5, and module 6.
