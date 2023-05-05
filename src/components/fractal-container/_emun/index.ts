export const containerEnum = {
  /** 根容器 */
  ROOT: 'root-conatiner',
  /** 封装容器 */
  WRAPPER_CONTAINER: 'wrapper_container', // 标记封装容器，可以拥有独立的内部逻辑，不会被当作纯粹容器移除掉
  /** 纯粹容器 */
  SIMPLE_CONTAINER: 'simple_container',
  /** iframe */
  IFRAME: 'iframe',
  /** 组件 */
  CMPT: 'component'
}
