# 构建新的元素示例

本文档将指导开发者如何在 Vue Print Designer 中添加一个新的自定义元素。我们将以添加一个简单的“星形 (Star)”元素为例。

## 步骤 1：定义元素类型

首先，在 `src/types/index.ts` 中的 `ElementType` 枚举中添加新的类型定义。

```typescript
// src/types/index.ts

export enum ElementType {
  // ... 现有类型
  TEXT = 'text',
  // ...
  STAR = 'star' // [!code ++]
}
```

## 步骤 2：创建元素组件

在 `src/components/elements/` 目录下创建一个新的 Vue 组件，例如 `StarElement.vue`。该组件负责渲染元素的内容，并导出属性配置 Schema。

```vue
<!-- src/components/elements/StarElement.vue -->
<script setup lang="ts">
import type { PrintElement } from '@/types';

defineProps<{
  element: PrintElement;
}>();
</script>

<script lang="ts">
import type { ElementPropertiesSchema } from '@/types';

// 定义属性面板配置
export const elementPropertiesSchema: ElementPropertiesSchema = {
  sections: [
    {
      title: 'properties.section.style',
      tab: 'style',
      fields: [
        { 
          label: 'properties.label.color', 
          type: 'color', 
          target: 'style', 
          key: 'color' 
        }
      ]
    }
  ]
};
</script>

<template>
  <div class="w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 24 24" :fill="element.style.color || '#000000'">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  </div>
</template>
```

## 步骤 3：注册组件

在 `src/components/canvas/Canvas.vue` 中导入新组件，并在 `getComponent` 函数中添加映射。

```typescript
// src/components/canvas/Canvas.vue

import StarElement from '../elements/StarElement.vue'; // [!code ++]

// ...

const getComponent = (type: ElementType) => {
  switch (type) {
    // ...
    case ElementType.STAR: return StarElement; // [!code ++]
    default: return TextElement;
  }
};
```

## 步骤 4：注册属性配置

在 `src/components/layout/PropertiesPanel.vue` 中导入组件的 Schema，并在 `getSchema` 函数中添加映射。

```typescript
// src/components/layout/PropertiesPanel.vue

import { elementPropertiesSchema as StarSchema } from '@/components/elements/StarElement.vue'; // [!code ++]

// ...

const getSchema = (type: ElementType): ElementPropertiesSchema | null => {
  switch (type) {
    // ...
    case ElementType.STAR: return StarSchema; // [!code ++]
  }
  return null;
};
```

## 步骤 5：添加到侧边栏

在 `src/components/layout/Sidebar.vue` 中配置侧边栏菜单项，使其可以被拖拽。

```typescript
// src/components/layout/Sidebar.vue
import StarIcon from '~icons/material-symbols/star'; // 导入图标

// ...

const categories = [
  // ...
  {
    title: 'sidebar.shapes',
    items: [
      // ...
      { type: ElementType.STAR, label: 'sidebar.star', icon: StarIcon }, // [!code ++]
    ]
  }
];

// ...

const getIcon = (type: ElementType) => {
  switch (type) {
    // ...
    case ElementType.STAR: return StarIcon; // [!code ++]
    // ...
  }
};
```

## 步骤 6：配置默认属性

在 `src/components/canvas/Canvas.vue` 中，配置新元素被拖入画布时的默认尺寸和属性。

```typescript
// src/components/canvas/Canvas.vue

const widthMap: Partial<Record<ElementType, number>> = {
  // ...
  [ElementType.STAR]: 100, // [!code ++]
};

const heightMap: Partial<Record<ElementType, number>> = {
  // ...
  [ElementType.STAR]: 100, // [!code ++]
};

// ...
// 注意：newElement 对象构建逻辑中，通常会自动使用 widthMap/heightMap
```

完成以上步骤后，重新启动开发服务器，你就可以在侧边栏看到新的“星形”元素，并将其拖拽到画布上进行编辑了。
