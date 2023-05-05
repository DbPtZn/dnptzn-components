<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { containerEnum, getBeAffectedObjIndex, getBeAffectedObjValue, useAllocateSize, useResizeTranslator } from '..'
import { FractalContainerConfig, HorizSplitter, VertSplitter, RecursiveContainer, IframeContainer, Provide } from '..'
const props = defineProps<{
  data: FractalContainerConfig
  currentId?: string
  maskVisible?: boolean
  shredderVisible?: string
  controlVisible?: string
}>()
const emits = defineEmits<{
  /** event: 事件 node: 进入节点  parentNode: 进入节点的父节点 index: 进入节点在父节点的子节点中的位置 insertType：插入的位置 */
  // 猜测 emits 是有缓存机制或其它不明机制，不使用 args 对象包裹向上进行递归传值的时候，会在上级simple容器触发onDrop并传入simple容器节点，覆盖了渲染节点
  (e: 'onDrop', args: { event: DragEvent; targetNode: FractalContainerConfig; targetNodeParent: FractalContainerConfig; index: number }): void
  (e: 'onDragEnter', event: DragEvent): void
  (e: 'onDragOver', event: DragEvent): void
  (e: 'onDragLeave', event: DragEvent): void
  /** 容器 */
  (e: 'onContainerClick', node: FractalContainerConfig): void
  (e: 'onContainerDragStart', event: DragEvent, dragNode: FractalContainerConfig): void
  (e: 'onContainerDragEnd', event: DragEvent, dragNode: FractalContainerConfig): void
  (e: 'onContainerRemove', node: FractalContainerConfig, parent: FractalContainerConfig): void
  (e: 'onShredderDrop', node: FractalContainerConfig, parent: FractalContainerConfig): void
  (e: 'onContainerMouseEnter', event: MouseEvent, node: FractalContainerConfig): void
  (e: 'onContainerMouseLeave', event: MouseEvent, node: FractalContainerConfig): void
  /** iframe */
  (e: 'onIframeFocus', containerId: string): void
  (e: 'onInnerMenuExpand', x: number, y: number, containerId: string): void
  /** control */
  (e: 'onControlMouseEnter', event: MouseEvent, node: FractalContainerConfig): void
  (e: 'onControlMouseLeave', event: MouseEvent, node: FractalContainerConfig): void
  (e: 'onControlContextmenu', event: MouseEvent, node: FractalContainerConfig): void
}>()
const containerRef = ref()
const heightDistribute = ref<number[]>([])
const widthDistribute = ref<number[]>([])
const minValDistribute = ref<number[]>([])
const warn = ref('无内容')
/** 侦听递归组件的数据变化，重新分配各容器大小 */
watch(
  () => props.data,
  () => {
    if (props.data.children.length !== 0) {
      const res = useAllocateSize(props.data)
      if (res) {
        const { widthDistributeData, heightDistributeData, minValDistributeData } = res
        widthDistribute.value = widthDistributeData
        heightDistribute.value = heightDistributeData
        minValDistribute.value = minValDistributeData
      }
    }
  },
  { deep: true }
)
onMounted(() => {
  /** 数据安全检测 */
  props.data.children.forEach((child, index) => {
    if (child.cmpt && child.url) {
      warn.value = '警告: 渲染组件 cmpt 和 url 不能同时存在!'
      console.warn('警告: 渲染组件 cmpt 和 url 不能同时存在！！！')
    }
  })
  /** 分配容器尺寸 */
  if (props.data.children.length !== 0) {
    const res = useAllocateSize(props.data)
    if (res) {
      const { widthDistributeData, heightDistributeData, minValDistributeData } = res
      widthDistribute.value = widthDistributeData
      heightDistribute.value = heightDistributeData
      minValDistribute.value = minValDistributeData
    }
  }
})
// ----------------------------------- Resize ---------------------------------------//
const isDragAllow = ref(true) // 是否允许容器拖拽
const currentVal = ref<number[]>([]) // 当前宽度分布
let initialVal: number[] = [] // 初始宽度分布
/** resize：开始 */
const handleResizeStart = (isRow: boolean) => {
  isDragAllow.value = false // 开始拖拉分隔条时禁止容器拖拽
  if (isRow) {
    initialVal = JSON.parse(JSON.stringify(widthDistribute.value))
    currentVal.value = widthDistribute.value
  } else {
    initialVal = JSON.parse(JSON.stringify(heightDistribute.value))
    currentVal.value = heightDistribute.value
  }
}
/** resize：拖拽（控制宽高） */
const handleResize = (value: number, index: number) => {
  /** 对 Resize 的数据进行加工转换 */
  const { activeIndex, distance, direction } = useResizeTranslator(value, index, initialVal, minValDistribute.value)
  /** 基于鼠标移动的距离调节窗口的宽度 */
  currentVal.value[activeIndex] = initialVal[activeIndex] + distance
  /** 获取被动窗口对象:  */
  const affectedIndex = getBeAffectedObjIndex(currentVal.value, initialVal, activeIndex, direction, minValDistribute.value)
  if (affectedIndex !== undefined) {
    /** 调节被动窗口，使所有窗口宽度之和始终为 100 %。基于所有窗口之和等于 100 这个规则，计算并获取被动窗口的值。 */
    currentVal.value[affectedIndex] = getBeAffectedObjValue(currentVal.value, affectedIndex)
  }
}
/** resize：结束 */
const handleResizeEnd = (_index: number) => {
  isDragAllow.value = true
}
// ----------------------------------- Drag ---------------------------------------//
/** 拖拽进入 */
const handleDragEnter = (ev: DragEvent) => {
  emits('onDragEnter', ev)
}
/** 拖拽经过 */
const handleDragOver = (ev: DragEvent) => {
  emits('onDragOver', ev)
}
/** 拖拽离开 */
const handleDragLeave = (ev: DragEvent) => {
  emits('onDragLeave', ev)
}
/** 拖拽放下 */
const handleDrop = (args: { event: DragEvent; targetNode: FractalContainerConfig; targetNodeParent: FractalContainerConfig; index: number }) => {
  emits('onDrop', args)
}
// ----------------------------------- Inner Iframe ---------------------------------------//
/** iframe 容器聚焦 */
const handleIframeFocus = (containerId: string) => {
  emits('onIframeFocus', containerId)
}
/** iframe 内部菜单展开事件（Alt + mousedown） */
const handleInnerMenuExpand = (x: number, y: number, containerId: string) => {
  emits('onInnerMenuExpand', x, y, containerId)
}
// ----------------------------------- Inner Drag ---------------------------------------//
/** 容器被拖拽开始 */
const handleContainerDragStart = (ev: DragEvent, dragNode: FractalContainerConfig) => {
  emits('onContainerDragStart', ev, dragNode)
}
/** 容器被拖拽结束 */
const handleContainerDragEnd = (ev: DragEvent, dragNode: FractalContainerConfig) => {
  emits('onContainerDragEnd', ev, dragNode)
}
const shredderFocus = ref(false) // 关闭控件聚焦状态
/** 文件销毁控件：进入 */
const handleShredderDragEnter = () => {
  shredderFocus.value = true
}
/** 文件销毁控件：离开 */
const handleShredderDragLeave = () => {
  shredderFocus.value = false
}
/** 文件销毁控件：放下 */
const handleShredderDrop = (node: FractalContainerConfig, parent: FractalContainerConfig) => {
  emits('onShredderDrop', node, parent)
}
// ----------------------------------- Container ---------------------------------------//
/** 容器移除 */
const handleContainerRemove = (node: FractalContainerConfig, parent: FractalContainerConfig) => {
  emits('onContainerRemove', node, parent)
}
/** 容器上的点击事件（iframe 内的不会触发） */
const handleClick = (node: FractalContainerConfig) => {
  emits('onContainerClick', node)
}
const handleContainerMouseEnter = (event: MouseEvent, node: FractalContainerConfig) => {
  emits('onContainerMouseEnter', event, node)
}
const handleContainerMouseleave = (event: MouseEvent, node: FractalContainerConfig) => {
  emits('onContainerMouseLeave', event, node)
}
/** -------------------------------- control -------------------------------- */
const handleControlMouseEnter = (ev: MouseEvent, node: FractalContainerConfig) => {
  emits('onControlMouseEnter', ev, node)
}
const handleControlMouseLeave = (ev: MouseEvent, node: FractalContainerConfig) => {
  emits('onControlMouseLeave', ev, node)
}
const handleControlContextmenu = (ev: MouseEvent, node: FractalContainerConfig) => {
  emits('onControlContextmenu', ev, node)
}
</script>

<template>
  <div
    ref="containerRef"
    :id="item.id"
    :name="item.type"
    :class="['custom-container', currentId === item.id ? 'custom-container-focus' : '']"
    v-for="(item, index) in data.children"
    :key="item.id"
    :style="{
      flexDirection: item.isRow ? 'row' : 'column',
      width: widthDistribute ? `${widthDistribute[index]}%` : 0,
      height: heightDistribute ? `${heightDistribute[index]}% ` : 0
    }"
    :draggable="item.type !== containerEnum.SIMPLE_CONTAINER && isDragAllow && item.allowDrag"
    @dragstart.stop="handleContainerDragStart($event, item)"
    @dragend.stop="handleContainerDragEnd($event, item)"
    @click.stop="handleClick(item)"
    @mouseenter="item.type !== containerEnum.SIMPLE_CONTAINER && handleContainerMouseEnter($event, item)"
    @mouseleave="item.type !== containerEnum.SIMPLE_CONTAINER && handleContainerMouseleave($event, item)"
  >
    <!-- 独立控件 -->
    <div
      v-if="(controlVisible === item.id || currentId === item.id) && item.useControl && item.type !== containerEnum.SIMPLE_CONTAINER"
      :class="['container-control']"
      @mouseenter="handleControlMouseEnter($event, item)"
      @mouseleave="handleControlMouseLeave($event, item)"
      @contextmenu="handleControlContextmenu($event, item)"
    >
      <span :class="['container-control-icon', 'justified', currentId === item.id ? 'container-focus' : '']" />
    </div>
    <!-- 分隔条 -->
    <component
      v-if="index && item.isSplitterRender"
      :is="data.isRow ? VertSplitter : HorizSplitter"
      @on-resize="handleResize($event, index)"
      @on-resize-end="handleResizeEnd(index)"
      @on-resize-start="handleResizeStart(data.isRow)"
    />
    <!-- 遮罩 -->
    <div
      class="mask"
      v-if="maskVisible && item.children.length === 0 && item.allowDrop"
      @drop="handleDrop({ event: $event, targetNodeParent: data, targetNode: item, index })"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver($event)"
      @dragleave.prevent="handleDragLeave"
    >
      <div class="mask-renderer"></div>
    </div>
    <!-- 销毁容器的控件 -->
    <div
      v-if="shredderVisible === item.id"
      :class="['container-shredder', shredderFocus && 'container-shredder-focus']"
      @drop="handleShredderDrop(item, data)"
      @dragenter.prevent="handleShredderDragEnter"
      @dragover.prevent="''"
      @dragleave.prevent="handleShredderDragLeave"
    >
      <div class="container-shredder-icon close" />
    </div>
    <!-- Provide: 将节点的父节点和节点所对应的元素注入树数据中 -->
    <Provide :node="item" :parent="data" />
    <!-- 插槽 -->
    <slot :node="item" :parent="data" v-if="item.children.length === 0">
      <div class="warn" title="点击移除该容器">
        <span @click="handleContainerRemove(item, data)">{{ warn }}</span>
      </div>
    </slot>
    <!-- 递归 -->
    <RecursiveContainer
      v-if="item.children"
      :data="item"
      :current-id="currentId"
      :mask-visible="maskVisible"
      :shredder-visible="shredderVisible"
      :control-visible="controlVisible"
      @on-container-click="handleClick"
      @on-container-drag-start="handleContainerDragStart"
      @on-container-drag-end="handleContainerDragEnd"
      @on-container-remove="handleContainerRemove"
      @on-container-mouse-enter="handleContainerMouseEnter"
      @on-container-mouse-leave="handleContainerMouseleave"
      @on-shredder-drop="handleShredderDrop"
      @on-iframe-focus="handleIframeFocus"
      @on-inner-menu-expand="handleInnerMenuExpand"
      @on-drag-enter="handleDragEnter"
      @on-drag-over="handleDragOver"
      @on-drag-leave="handleDragLeave"
      @on-drop="handleDrop($event)"
      @on-control-mouse-enter="handleControlMouseEnter"
      @on-control-mouse-leave="handleControlMouseLeave"
      @on-control-contextmenu="handleControlContextmenu"
    >
      <!-- 递归插槽 -->
      <template #default="{ node }">
        <!-- 渲染组件插件 -->
        <component v-if="node.children.length === 0 && node.cmpt && !node.url" :is="node.cmpt" />
        <!-- iframe 插件 -->
        <IframeContainer
          v-if="node.children.length === 0 && node.url && !node.cmpt"
          :current-id="currentId"
          :url="node.url"
          :container-id="node.id"
          @on-iframe-focus="handleIframeFocus"
          @on-inline-menu-expand="handleInnerMenuExpand"
        />
      </template>
    </RecursiveContainer>
  </div>
</template>

<style lang="scss" scoped>
$--text-color-primary: #323233;
$--text-color-secondary: #969799;
.wrapper {
  display: flex;
  width: 100%;
  height: 100%;
}
.custom-container {
  // 上层的嵌套层的属性也会覆盖在聚焦容器上
  position: relative;
  display: flex;
  // border-right: 1px solid @--border-color;
  // border-bottom: 1px solid @--border-color;
}
.warn {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  span {
    &:hover {
      cursor: pointer;
      color: #969799;
    }
  }
}

.mask {
  z-index: 1;
  position: absolute;
  width: 100%;
  height: 100%;
}
.mask-renderer {
  // 必须禁止触发事件
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  transition: all 0.3s ease-in-out;
}
.mask-renderer-middle {
  background-color: rgba(0, 0, 0, 0.616);
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.mask-renderer-left {
  top: 0;
  bottom: 0;
  left: 0;
  right: 50%;
  background-color: rgba(0, 0, 0, 0.616);
}
.mask-renderer-right {
  top: 0;
  bottom: 0;
  left: 50%;
  right: 0;
  background-color: rgba(0, 0, 0, 0.616);
}
.mask-renderer-top {
  top: 0;
  bottom: 50%;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.616);
}
.mask-renderer-bottom {
  top: 50%;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.616);
}
// ------------------ shredder ------------------- //
.container-shredder {
  z-index: 3;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 100px;
  width: 100px;
  color: $--text-color-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  .container-shredder-icon {
    pointer-events: none;
    // font-size: 64px;
    scale: 3;
  }
}
.container-shredder-focus {
  background-color: rgba(0, 0, 0, 0.616);
  border: 1px dashed #dcdee0;
  color: #f7f8fa;
}
.close {
  color: inherit;
  position: absolute;
  margin-top: 0;
  margin-left: 0;
  width: 21px;
  height: 21px;
  animation: fadeInDown 0.3s ease-in-out;
}

.close:before {
  content: '';
  position: absolute;
  top: 10px;
  width: 21px;
  height: 1px;
  background-color: currentColor;
  -webkit-transform: rotate(-45deg);
  transform: rotate(-45deg);
}

.close:after {
  content: '';
  position: absolute;
  top: 10px;
  width: 21px;
  height: 1px;
  background-color: currentColor;
  -webkit-transform: rotate(45deg);
  transform: rotate(45deg);
}
// ----------------- Control ------------------ //
.container-control {
  z-index: 2;
  position: absolute;
  top: 0px;
  left: 0px;
  .container-control-icon {
    position: absolute;
    margin: 8px;
    color: $--text-color-secondary;
    cursor: pointer;
    &:hover {
      color: $--text-color-primary;
    }
  }
}
.justified {
  color: #000;
  position: absolute;
  margin-left: 2px;
  margin-top: 6px;
  width: 17px;
  height: 5px;
  border-top: solid 1px currentColor;
  border-bottom: solid 1px currentColor;
}

.justified:before {
  content: '';
  position: absolute;
  top: 2px;
  left: 0;
  width: 17px;
  height: 5px;
  border-top: solid 1px currentColor;
  border-bottom: solid 1px currentColor;
}
</style>

<!-- 
@on-iframe-drag-start="handleIframeDragStart"
@on-iframe-drag-end="handleIframeDragEnd"
@on-iframe-remove="handleIframeRemove"
@on-iframe-remove="handleIframeRemove(node, parent)"
@on-iframe-drag-start="handleIframeDragStart($event, node)"
@on-iframe-drag-end="handleIframeDragEnd($event, node)"
-->
