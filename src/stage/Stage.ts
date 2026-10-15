import { Application, Container } from 'pixi.js'
import gsap from 'gsap'
import type { CameraState } from './Viewport'
import type { Point, Scene, SceneContext, SceneFactory } from './types'

export type NavDir = 'forward' | 'back' | 'none'

const tween = (target: object, vars: gsap.TweenVars) =>
  new Promise<void>((resolve) => gsap.to(target, { ...vars, onComplete: resolve }))

/**
 * 整個 App 只有一個 Pixi Application（iOS 對 WebGL context 數量有限制）。
 * 路由切換時只換場景；自己管理 render loop 以控制耗電：
 *   - 互動 / 轉場中：每幀渲染（60fps）
 *   - 只有環境動畫：限制 30fps
 *   - 動畫關閉且沒有互動：完全不渲染
 */
export class Stage {
  app = new Application()
  current: Scene | null = null
  private layer = new Container()
  private cameraMemory = new Map<string, CameraState>()
  private navToken = 0
  private locked = false
  private hotUntil = 0
  private lastRender = 0
  private lastFrame = 0
  private dirty = true
  private frames: number[] = []
  motion = true
  /** 被外層 App 隱藏時（切到其他 tab）完全停止渲染 */
  private paused = false

  constructor(
    private factories: Record<string, SceneFactory>,
    private ctx: Omit<SceneContext, 'app' | 'motion'>,
  ) {}

  async init(host: HTMLElement) {
    await this.app.init({
      width: innerWidth,
      height: innerHeight,
      background: 0x101621,
      antialias: true,
      resolution: Math.min(devicePixelRatio, 2),
      autoDensity: true,
      autoStart: false,
      preference: 'webgl',
    })
    this.app.ticker.stop()
    this.app.stage.addChild(this.layer)
    host.appendChild(this.app.canvas)
    this.bindInput(this.app.canvas)
    addEventListener('resize', () => {
      this.app.renderer.resize(innerWidth, innerHeight)
      this.current?.viewport.layout(innerWidth, innerHeight)
      this.dirty = true
    })
    requestAnimationFrame(this.loop)
  }

  private get sceneCtx(): SceneContext {
    return { ...this.ctx, app: this.app, motion: () => this.motion }
  }

  setMotion(on: boolean) {
    this.motion = on
    this.current?.setMotion(on)
    this.dirty = true
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return
    this.paused = paused
    if (paused) gsap.globalTimeline.pause()
    else {
      gsap.globalTimeline.resume()
      this.lastFrame = 0
      this.dirty = true
    }
  }

  zoom(factor: number) {
    if (!this.current || this.locked) return
    const v = this.current.viewport
    const from = v.zoom
    const proxy = { z: from }
    this.heat(400)
    gsap.to(proxy, {
      z: from * factor,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        v.zoomAt(proxy.z / v.zoom, innerWidth / 2, innerHeight / 2)
      },
    })
  }

  /** 切換場景：舊場景朝點擊點放大淡出（前進）或縮小淡出（返回），新場景淡入 */
  async show(key: string, dir: NavDir, from?: Point) {
    const token = ++this.navToken
    const old = this.current
    const W = innerWidth
    const H = innerHeight
    this.locked = true
    this.heat(1500)

    const loading = this.factories[key](this.sceneCtx)
    let out: Promise<void> = Promise.resolve()
    if (old) {
      this.cameraMemory.set(old.key, old.viewport.getState())
      old.viewport.stop()
      const p = from ?? { x: W / 2, y: H / 2 }
      gsap.killTweensOf(old.root)
      gsap.killTweensOf(old.root.scale)
      old.root.pivot.set(p.x, p.y)
      old.root.position.set(p.x, p.y)
      const s = dir === 'back' ? 0.85 : dir === 'forward' ? 2.4 : 1
      out = Promise.all([
        tween(old.root.scale, { x: s, y: s, duration: 0.42, ease: 'power2.in' }),
        tween(old.root, { alpha: 0, duration: 0.42, ease: 'power1.in' }),
      ]).then(() => {})
    }

    const [scene] = await Promise.all([loading, out])
    if (old) {
      if (this.current === old) this.current = null
      old.destroy()
    }
    if (token !== this.navToken) {
      scene.destroy()
      return
    }

    scene.viewport.layout(W, H, dir === 'back' ? this.cameraMemory.get(key) : undefined)
    const root = scene.root
    root.pivot.set(W / 2, H / 2)
    root.position.set(W / 2, H / 2)
    const s0 = dir === 'back' ? 1.3 : dir === 'forward' ? 0.82 : 1
    root.scale.set(s0)
    root.alpha = 0
    this.layer.addChild(root)
    this.current = scene
    this.heat(800)
    await Promise.all([
      tween(root.scale, { x: 1, y: 1, duration: 0.5, ease: 'power2.out' }),
      tween(root, { alpha: 1, duration: 0.4, ease: 'power1.out' }),
    ])
    if (token === this.navToken) this.locked = false
  }

  private heat(ms: number) {
    this.hotUntil = Math.max(this.hotUntil, performance.now() + ms)
  }

  private loop = (now: number) => {
    requestAnimationFrame(this.loop)
    if (this.paused) return
    const dt = Math.min(50, now - (this.lastFrame || now))
    this.lastFrame = now
    const moving = this.current?.viewport.step(dt) ?? false
    const hot = moving || now < this.hotUntil
    const interval = hot ? 0 : this.motion ? 1000 / 30 - 3 : Infinity
    if (!this.dirty && now - this.lastRender < interval) return
    this.current?.update(now - this.lastRender, now / 1000)
    this.app.render()
    this.dirty = false
    this.lastRender = now
    this.frames.push(now)
    while (this.frames.length && this.frames[0] < now - 1000) this.frames.shift()
  }

  /** 最近一秒實際渲染的幀數（給除錯面板） */
  get fps() {
    const now = performance.now()
    return this.frames.filter((t) => t > now - 1000).length
  }

  private bindInput(el: HTMLCanvasElement) {
    const pts = new Map<number, Point>()
    let start: { x: number; y: number; t: number; moved: number } | null = null
    let prevDist = 0
    let prevMid: Point | null = null
    let vel = { x: 0, y: 0, t: 0 }

    el.addEventListener('pointerdown', (e) => {
      if (this.locked) return
      el.setPointerCapture(e.pointerId)
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      this.current?.viewport.stop()
      start = pts.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 } : null
      prevDist = 0
      prevMid = null
      vel = { x: 0, y: 0, t: performance.now() }
      this.heat(300)
    })

    el.addEventListener('pointermove', (e) => {
      const old = pts.get(e.pointerId)
      if (!old || !this.current || this.locked) return
      const cur = { x: e.clientX, y: e.clientY }
      pts.set(e.pointerId, cur)
      const v = this.current.viewport
      if (pts.size === 1) {
        const dx = cur.x - old.x
        const dy = cur.y - old.y
        v.pan(dx, dy)
        if (start) start.moved += Math.abs(dx) + Math.abs(dy)
        const now = performance.now()
        const k = Math.max(1, now - vel.t)
        vel = { x: vel.x * 0.6 + (dx / k) * 0.4, y: vel.y * 0.6 + (dy / k) * 0.4, t: now }
      } else if (pts.size === 2) {
        start = null
        const [a, b] = [...pts.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        if (prevDist) v.zoomAt(dist / prevDist, mid.x, mid.y)
        if (prevMid) v.pan(mid.x - prevMid.x, mid.y - prevMid.y)
        prevDist = dist
        prevMid = mid
      }
      this.heat(300)
    })

    const end = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.delete(e.pointerId)
      prevDist = 0
      prevMid = null
      if (pts.size || !this.current || this.locked) return
      const isTap = start && start.moved < 10 && performance.now() - start.t < 450
      if (isTap && e.type === 'pointerup') this.current.onTap(e.clientX, e.clientY)
      else if (performance.now() - vel.t < 80) this.current.viewport.fling(vel.x, vel.y)
      start = null
      this.heat(300)
    }
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)

    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        if (this.locked) return
        this.current?.viewport.zoomAt(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY)
        this.heat(300)
      },
      { passive: false },
    )
  }
}
