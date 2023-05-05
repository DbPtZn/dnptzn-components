import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
const routes: Array<RouteRecordRaw> = [
  /** 主页 */
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "about" */ '../test/FractalContainerPage.vue')
  },
  {
    path: '/home',
    redirect: 'home'
  },
  {
    path: '/one',
    name: 'one',
    component: () => import(/* webpackChunkName: "about" */ '../test/modules/PageOne.vue')
  },
  {
    path: '/two',
    name: 'two',
    component: () => import(/* webpackChunkName: "about" */ '../test/modules/PageTwo.vue')
  },
  {
    path: '/three',
    name: 'three',
    component: () => import(/* webpackChunkName: "about" */ '../test/modules/PageThree.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
