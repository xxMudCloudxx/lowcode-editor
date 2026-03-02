/**
 * @file Vue 运行时组件生成插件
 * @description 向生成项目中注入 Page、PageHeader 等 Vue 运行时组件。
 */

import type { IProjectPlugin, ProjectBuilder } from "@lowcode/schema";

const pageHeaderContent = `<!-- PageHeader.vue - 由 lowcode-editor 自动生成 -->
<script setup lang="ts">
import { Space, Typography } from 'ant-design-vue';

const { Title, Text } = Typography;

interface Props {
  title?: string;
  subTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subTitle: '',
});
</script>

<template>
  <div
    :style="{
      border: '1px solid #f0f0f0',
      padding: '16px 24px',
    }"
  >
    <Space direction="vertical">
      <Title :level="3" :style="{ margin: 0 }">
        {{ props.title }}
      </Title>
      <Text type="secondary">{{ props.subTitle }}</Text>
    </Space>
  </div>
</template>
`;

const pageContent = `<!-- Page.vue - 由 lowcode-editor 自动生成 -->
<script setup lang="ts">
interface Props {
  style?: Record<string, string>;
}

defineProps<Props>();
</script>

<template>
  <div class="page-wrapper" :style="style">
    <slot />
  </div>
</template>
`;

const vueComponentsPlugin: IProjectPlugin = {
  type: "project",
  name: "vue-project-components",

  run: (builder: ProjectBuilder) => {
    builder.addFile({
      fileName: "PageHeader.vue",
      filePath: "src/components/PageHeader.vue",
      fileType: "other",
      content: pageHeaderContent,
    });

    builder.addFile({
      fileName: "Page.vue",
      filePath: "src/components/Page.vue",
      fileType: "other",
      content: pageContent,
    });

    builder.addFile({
      fileName: "index.ts",
      filePath: "src/components/index.ts",
      fileType: "ts",
      content: `export { default as PageHeader } from './PageHeader.vue';
export { default as Page } from './Page.vue';
`,
    });
  },
};

export default vueComponentsPlugin;
