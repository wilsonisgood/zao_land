<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Stage } from './stage/Stage'
import type { Point } from './stage/types'
import { sceneFactories } from './scenes'
import { depthOf, parentOf } from './router'
import { useUi } from './stores/ui'
import SideRail from './components/SideRail.vue'
import StudentSheet from './components/StudentSheet.vue'

const host = ref<HTMLElement>()
const route = useRoute()
const router = useRouter()
const ui = useUi()
const fps = ref(0)
let pendingFrom: Point | undefined

const stage = new Stage(sceneFactories, {
  navigate(path, from) {
    pendingFrom = from
    router.push(path)
  },
  toast: (msg) => ui.showToast(msg),
  openStudent: (id) => (ui.studentId = id),
})

// 開發時方便在 console 檢查：window.__stage
if (import.meta.env.DEV) Object.assign(window, { __stage: stage })

const depth = computed(() => depthOf(route.path))
const crumbs = computed(() =>
  route.matched.length
    ? router
        .getRoutes()
        .filter((r) => r.meta.title && route.path.startsWith(r.path) && (route.path === r.path || route.path[r.path.length] === '/'))
        .sort((a, b) => a.path.length - b.path.length)
        .map((r) => ({ path: r.path, title: r.meta.title }))
    : [],
)
// 手機寬度有限：超過三層時只顯示第一層、上一層與目前位置
const shownCrumbs = computed(() =>
  crumbs.value.length > 3 ? [crumbs.value[0], { path: '', title: '…' }, ...crumbs.value.slice(-2)] : crumbs.value,
)

/** 往上層：若上一筆歷史剛好是目標就用 back，讓瀏覽器返回鍵與按鈕行為一致 */
function goTo(path: string) {
  ui.studentId = null
  if (history.state?.back === path) router.back()
  else router.push(path)
}

onMounted(async () => {
  await stage.init(host.value!)
  stage.setMotion(ui.motion)
  await router.isReady()
  watch(
    () => route.path,
    (to, from) => {
      const scene = route.meta.scene
      if (!scene) return
      ui.studentId = null
      const dir = !from ? 'none' : depthOf(to) > depthOf(from) ? 'forward' : 'back'
      stage.show(scene, dir, pendingFrom)
      pendingFrom = undefined
    },
    { immediate: true },
  )
  setInterval(() => (fps.value = stage.fps), 500)
  // 嵌在原型 App 的「世界」tab 裡：切到其他 tab 時暫停渲染
  addEventListener('message', (e) => {
    if (e.origin !== location.origin) return
    if (e.data?.type === 'zao:pause') stage.setPaused(true)
    if (e.data?.type === 'zao:resume') stage.setPaused(false)
  })
})

watch(() => ui.motion, (on) => stage.setMotion(on))
</script>

<template>
  <div ref="host" class="stage-host" />

  <header class="crumbs">
    <template v-for="(c, i) in shownCrumbs" :key="c.path">
      <span v-if="i" class="sep">›</span>
      <span v-if="!c.path" class="sep">{{ c.title }}</span>
      <button v-else-if="i < shownCrumbs.length - 1" class="crumb" @click="goTo(c.path)">{{ c.title }}</button>
      <strong v-else class="crumb current">{{ c.title }}</strong>
    </template>
  </header>

  <SideRail
    :depth="depth"
    @world="goTo('/world')"
    @up="goTo(parentOf(route.path))"
    @zoom="(f: number) => stage.zoom(f)"
  />

  <Transition name="fade">
    <div v-if="ui.toast" class="toast">{{ ui.toast }}</div>
  </Transition>

  <Transition name="sheet">
    <StudentSheet v-if="ui.studentId" :id="ui.studentId" @close="ui.studentId = null" />
  </Transition>

  <button class="hud" @click="ui.motion = !ui.motion">
    {{ fps }} fps · 環境動畫{{ ui.motion ? '開' : '關' }}
  </button>
</template>
