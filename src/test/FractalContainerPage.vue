<script lang="ts" setup>
import { markRaw, ref } from "vue";
import { FractalContainerConfig } from "../components/fractal-container";
import FractalContainer from "../components/fractal-container/FractalContainer.vue";
import { PageOne, PageFour } from "./modules/_api";

const data = ref<FractalContainerConfig>(
  {
    id: "root-container",
    type: "root-container",
    url: "",
    cmpt: null,
    isRow: true,
    isSplitterRender: false,
    ratio: 100,
    min: 100,
    children: [
      {
        id: "one",
        type: "one",
        cmpt: markRaw(PageOne),
        // url: 'http://127.0.0.1:5173/#/one',
        isRow: false,
        isSplitterRender: true,
        allowDrag: true,
        allowDrop: true,
        useControl: true,
        min: 20,
        children: [],
      },
      {
        id: "two",
        type: "two",
        // cmpt: markRaw(PageTwo),
        url: "http://127.0.0.1:5173/#/two",
        isRow: false,
        isSplitterRender: true,
        allowDrag: true,
        allowDrop: true,
        useControl: true,
        min: 10,
        children: [],
      },
      {
        id: "three",
        type: "three",
        // cmpt: markRaw(PageThree),
        url: "http://127.0.0.1:5173/#/three",
        isRow: false,
        isSplitterRender: true,
        allowDrag: true,
        allowDrop: true,
        useControl: true,
        min: 15,
        children: [],
      },
      {
        id: "fourth",
        type: "fourth",
        cmpt: markRaw(PageFour),
        isRow: false,
        isSplitterRender: true,
        allowDrag: true,
        allowDrop: true,
        min: 15,
        children: [],
      }
    ]
  }
)
</script>

<template>
  <div class="fractal-container-page">
    <FractalContainer
      ref="layoutRef"
      :data="data"
      :allow-container-auto-drop="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.fractal-container-page {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
