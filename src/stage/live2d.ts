import type { Renderer } from 'pixi.js'

// Live2D 執行環境：只在第一次進入有角色的場景時才載入（Cubism Core + 函式庫），
// 世界／區域地圖不需要付出這個成本。
type Live2DModule = typeof import('untitled-pixi-live2d-engine/cubism')

let ready: Promise<Live2DModule> | null = null

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`無法載入 ${src}`))
    document.head.appendChild(s)
  })
}

export function loadLive2D(renderer: Renderer) {
  ready ??= (async () => {
    // Core 需與引擎內建的 Cubism Framework 相容：目前用 5.x（6.x 改了 API，引擎尚未支援）
    if (!('Live2DCubismCore' in window)) await loadScript('live2d/live2dcubismcore.min.js?v=5.1.0')
    const mod = await import('untitled-pixi-live2d-engine/cubism')
    mod.config.sound = false
    // 延遲載入，所以在 renderer 建好之後才掛上 Live2D 的 render pipe（角色才會依場景圖層順序繪製）
    const pipes = renderer.renderPipes as unknown as Record<string, unknown>
    pipes.live2d ??= new mod.Live2DPlugin(renderer as never)
    return mod
  })()
  return ready
}
