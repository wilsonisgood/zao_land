import { createRouter, createWebHashHistory } from 'vue-router'

const Empty = { render: () => null }

declare module 'vue-router' {
  interface RouteMeta {
    scene: string
    title: string
  }
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/world' },
    { path: '/world', component: Empty, meta: { scene: 'world', title: '朝霧大陸' } },
    { path: '/world/warm', component: Empty, meta: { scene: 'warm', title: '暖谷領' } },
    { path: '/world/warm/academy', component: Empty, meta: { scene: 'street', title: '映河書院' } },
    { path: '/world/warm/academy/math', component: Empty, meta: { scene: 'college', title: '數理學院' } },
    { path: '/world/warm/academy/math/classroom', component: Empty, meta: { scene: 'classroom', title: '學遠教室' } },
  ],
})

/** 層級深度：/world = 0 */
export const depthOf = (path: string) => path.split('/').filter(Boolean).length - 1
export const parentOf = (path: string) => path.split('/').slice(0, -1).join('/') || '/world'
