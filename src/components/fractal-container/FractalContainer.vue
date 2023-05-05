<script lang="ts" setup>
import { ref } from 'vue'
import { RecursiveContainer, IframeContainer } from '.'
import { ContainerTree } from './_kit/_api'
import { FractalContainerConfig, InsertType } from './_type'
const props = defineProps<{
  data: FractalContainerConfig
  currentId?: string
  /** 开启遮罩 */
  maskVisible?: boolean
  /** 是否允许容器自动处理 Drop 行为，开启的情况下组件内部实现容器的拖拽替换。 */
  allowContainerAutoDrop?: boolean
}>()
const emits = defineEmits<{
  /** event: 事件 node: 进入节点  parentNode: 进入节点的父节点 index: 进入节点在父节点的子节点中的位置 insertType：插入的位置 */
  (e: 'onDrop', event: DragEvent, targetNode: FractalContainerConfig, targetNodeParent: FractalContainerConfig, index: number, insertType: InsertType): void
  (e: 'onDragEnter', event: DragEvent): void
  (e: 'onDragOver', event: DragEvent): void
  (e: 'onDragLeave', event: DragEvent): void
  /** 容器事件 */
  (e: 'onContainerDragStart', event: DragEvent, dragNode: FractalContainerConfig): void
  (e: 'onContainerDragEnd', event: DragEvent, dragNode: FractalContainerConfig): void
  (e: 'onContainerClick', node: FractalContainerConfig): void
  (e: 'onContainerRemove', node: FractalContainerConfig, parent: FractalContainerConfig): void
  /** iframe 容器事件 */
  (e: 'onIframeFocus', containerId: string): void
  (e: 'onInnerMenuExpand', x: number, y: number, containerId: string): void
  /** control */
  (e: 'onControlMouseEnter', event: MouseEvent, node: FractalContainerConfig): void
  (e: 'onControlMouseLeave', event: MouseEvent, node: FractalContainerConfig): void
  (e: 'onControlContextmenu', event: MouseEvent, node: FractalContainerConfig): void
}>()
defineExpose({
  /** 通过 id 查询容器节点 */
  findNodeById: (id: string) => containerTree.findNodeById(id),
  /** 通过 url 查询容器节点 */
  findNodeByUrl: (url: string) => containerTree.findNodeByUrl(url),
  /** 通过 id 查询相应节点的父容器 */
  findParentNodeById: (id: string) => containerTree.findParentNodeById(id),
  /** 通过 name 找到第一个 name 匹配的容器 */
  findFirstNodeByType: (type: string) => containerTree.findFirstNodeByType(type),
  /** 通过 id 查询容器并将其移除, 通过该方法移除容器不会触发组件中的移除事件，会返回被移除的节点 */
  findNodeByIdAndRemove: (id: string) => containerTree.findNodeByIdAndRemove(id),
  /** 通过节点删除容器 */
  removeByNode: (node: FractalContainerConfig, parentNode: FractalContainerConfig) => containerTree.removeByNode(node, parentNode),
  /** 在全局数据中找到空节点并移除它们 */
  findEmptyContainerAndRemove: () => containerTree.findEmptyNodeAndRemove(),
  /** 在全局数据中找到非必要嵌套节点并清理它们 */
  findUnnecessaryNestedNodeAndClean: () => containerTree.findUnnecessaryNestedNodeAndClean()
})
const containerTree = new ContainerTree(props.data)
/** --------------------------------Container---------------------------------- */
const innerControlVisible = ref('') // 拖拽控件
const innerShredderVisible = ref('') // 销毁控件
const innerMaskController = ref(false)
let sourceNode: FractalContainerConfig | null = null
const handleDragEnter = (ev: DragEvent) => {
  emits('onDragEnter', ev)
}
const insertType = ref<InsertType>('unset')
const handleDragOver = (ev: DragEvent) => {
  const target = ev.target as HTMLElement
  const renderer = target.children[0] as HTMLElement
  const { x, y } = MouseRelativePosition(ev, target.getBoundingClientRect())
  if (x < 10) {
    // console.log('靠近左边界')
    insertType.value = 'left'
    renderer.className = `mask-renderer mask-renderer-${insertType.value}`
    return
  }
  if (x > 90) {
    // console.log('靠近右边界')
    insertType.value = 'right'
    renderer.className = `mask-renderer mask-renderer-${insertType.value}`
    return
  }
  if (y < 10) {
    // console.log('靠近上边界')
    insertType.value = 'top'
    renderer.className = `mask-renderer mask-renderer-${insertType.value}`
    return
  }
  if (y > 90) {
    // console.log('靠近下边界')
    insertType.value = 'bottom'
    renderer.className = `mask-renderer mask-renderer-${insertType.value}`
    return
  }
  insertType.value = 'middle'
  renderer.className = `mask-renderer mask-renderer-${insertType.value}`
  // 计算鼠标在容器中的相对位置，以百分比数值输出（0 - 100）
  function MouseRelativePosition(ev: DragEvent, rect: DOMRect) {
    const x = Math.round(((ev.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((ev.clientY - rect.top) / rect.height) * 100)
    return { x, y }
  }
  emits('onDragOver', ev)
}
/** 拖拽离开 */
const handleDragLeave = (ev: DragEvent) => {
  const target = ev.target as HTMLElement
  const renderer = target.children[0] as HTMLElement
  if (renderer.classList.contains(`mask-renderer-${insertType.value}`)) {
    renderer.classList.remove(`mask-renderer-${insertType.value}`)
  }
  emits('onDragLeave', ev)
}
/** 拖拽放下 */
const handleDrop = (args: { event: DragEvent; targetNode: FractalContainerConfig; targetNodeParent: FractalContainerConfig; index: number }) => {
  innerShredderVisible.value = ''
  innerMaskController.value = false
  const { event, targetNode, targetNodeParent, index } = args
  if (props.allowContainerAutoDrop && sourceNode) {
    containerTree.moveNode(sourceNode, targetNode, targetNodeParent, index, insertType.value)
    // sourceNode = null // 因为 onIframeDragEnd 可能不会触发，所以这里对 sourceNode 进行重置
  }
  const target = event.target as HTMLElement
  const renderer = target.children[0] as HTMLElement
  if (renderer.classList.contains(`mask-renderer-${insertType.value}`)) {
    renderer.classList.remove(`mask-renderer-${insertType.value}`)
  }
  emits('onDrop', event, targetNode, targetNodeParent, index, insertType.value)
}
/** 容器上的点击事件（iframe 内的不会触发） */
const handleClick = (node: FractalContainerConfig) => {
  containerTree.findUnnecessaryNestedNodeAndClean()
  emits('onContainerClick', node)
}
const draggable = ref(false)
const handleContainerDragStart = (ev: DragEvent, dragNode: FractalContainerConfig) => {
  if (!draggable.value && dragNode.useControl) {
    // 如果 useControl 是 true, 会显示拖拽控件，并且只能通过控件拖拽容器。反之，全容器都可拖拽
    ev.preventDefault()
  }
  innerMaskController.value = true
  sourceNode = dragNode
  const timer = setTimeout(() => {
    // 延迟。关闭区不能立即出现，否则也会显示在拖拽页面上
    draggable.value && (innerShredderVisible.value = dragNode.id)
    clearTimeout(timer)
  }, 10)
  emits('onContainerDragStart', ev, dragNode)
}
const handleContainerDragEnd = (ev: DragEvent, dragNode: FractalContainerConfig) => {
  innerMaskController.value = false
  sourceNode = null
  innerShredderVisible.value = ''
  emits('onContainerDragEnd', ev, dragNode)
}
const handleContainerRemove = (node: FractalContainerConfig, parent: FractalContainerConfig) => {
  containerTree.removeByNode(node)
  containerTree.findEmptyNodeAndRemove()
  emits('onContainerRemove', node, parent)
}
const handleContainerMouseEnter = (event: MouseEvent, node: FractalContainerConfig) => {
  innerControlVisible.value = node.id
}
const handleContainerMouseleave = (event: MouseEvent, node: FractalContainerConfig) => {
  innerControlVisible.value = ''
}
/** -------------------------------- control -------------------------------- */
const handleControlMouseEnter = (ev: MouseEvent, node: FractalContainerConfig) => {
  draggable.value = true
  emits('onControlMouseEnter', ev, node)
}
const handleControlMouseLeave = (ev: MouseEvent, node: FractalContainerConfig) => {
  draggable.value = false
  emits('onControlMouseLeave', ev, node)
}
const handleControlContextmenu = (ev: MouseEvent, node: FractalContainerConfig) => {
  emits('onControlContextmenu', ev, node)
}
/** --------------------------------Iframe---------------------------------- */
/** iframe 容器聚焦 */
const handleIframeFocus = (containerId: string) => {
  emits('onIframeFocus', containerId)
}
/** iframe 内部菜单展开事件（Alt + mousedown） */
const handleInnerMenuExpand = (x: number, y: number, containerId: string) => {
  emits('onInnerMenuExpand', x, y, containerId)
}
const handleContainerDrop = (node: FractalContainerConfig, parent: FractalContainerConfig) => {
  innerMaskController.value = false
  sourceNode = null
  innerShredderVisible.value = ''
  containerTree.removeByNode(node, parent)
  containerTree.findEmptyNodeAndRemove()
  containerTree.findUnnecessaryNestedNodeAndClean()
}
</script>

<template>
  <RecursiveContainer
    :data="data"
    :current-id="currentId"
    :mask-visible="maskVisible || innerMaskController"
    :shredder-visible="innerShredderVisible"
    :control-Visible="innerControlVisible"
    @on-container-click="handleClick"
    @on-container-drag-start="handleContainerDragStart"
    @on-container-drag-end="handleContainerDragEnd"
    @on-container-remove="handleContainerRemove"
    @on-container-mouse-enter="handleContainerMouseEnter"
    @on-container-mouse-leave="handleContainerMouseleave"
    @on-shredder-drop="handleContainerDrop"
    @on-iframe-focus="handleIframeFocus"
    @on-inner-menu-expand="handleInnerMenuExpand"
    @on-drag-enter="handleDragEnter"
    @on-drag-over="handleDragOver"
    @on-drag-leave="handleDragLeave"
    @on-drop="handleDrop"
    @on-control-mouse-enter="handleControlMouseEnter"
    @on-control-mouse-leave="handleControlMouseLeave"
    @on-control-contextmenu="handleControlContextmenu"
  >
    <template #default="{ node }">
      <component v-if="node.children.length === 0 && node.cmpt && !node.url" :is="node.cmpt" />
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
</template>

<style lang="scss" scoped></style>
<!-- 
  主要作用是在递归组件和实例之间增加一层封装，
  将部分依靠递归组件自身可以独立处理的行为封装在组件内部，比如移除容器、组件拖拽放置等功能。
  但这样做的后果是我们不得不再写一遍 emits 将事件抛出。
  待优化。
-->
