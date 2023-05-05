import { Component } from 'vue'

export interface FractalContainerConfig {
  id: string
  type: ContainerType
  url?: string //渲染 iframe
  cmpt?: Component | null // 渲染组件
  isRow: boolean // 是否水平分布
  isSplitterRender?: boolean // 是否渲染分隔条(默认不渲染)
  ratio?: number // 宽度/高度百分比（0—100）， 只在 isRow = true 条件下生效 (最好是正整数)
  min?: number // 指定宽或高的最小值 (最好是正整数，且不超过 ratio)
  useControl?: boolean // 使用拖拽控件
  allowDrag?: boolean // 判断节点能否被拖拽
  allowDrop?: boolean // 拖拽时判定目标节点能否成为拖动目标位置
  element?: Element
  parent?: FractalContainerConfig
  children: FractalContainerConfig[]
}

/** 拖拽插入容器的位置 */
export type InsertType = 'left' | 'right' | 'top' | 'bottom' | 'middle' | 'unset'

/** 容器的类型 */
export type ContainerType = 'root-conatiner' | 'wrapper_container' | 'simple_container' | 'iframe' | 'component' | string
