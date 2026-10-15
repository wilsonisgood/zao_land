import { Container, Graphics, Polygon } from 'pixi.js'
import gsap from 'gsap'
import { Viewport, type CameraState } from './Viewport'
import type { Hotspot, Scene, SceneContext } from './types'
import { Character } from '../scenes/Character'
import { characterById } from '../data/characters'

export interface CharacterSlot {
  id: string
  x: number
  /** 頭頂在場景中的 y */
  top: number
  /** 角色（頭頂到腳底）在場景中的高度 */
  height: number
  /** 放進哪個圖層（控制前後遮擋）；預設為內容最上層 */
  layer?: Container
}

export interface SceneOptions {
  width: number
  height: number
  maxZoom: number
  initial: CameraState
}

/** 所有場景共用：鏡頭、熱區點擊、可暫停的環境動畫、銷毀 */
export class BaseScene implements Scene {
  readonly root = new Container()
  readonly viewport: Viewport
  protected hotspots: { spot: Hotspot; shape: Polygon }[] = []
  private ambientTweens: gsap.core.Animation[] = []
  protected characters: Character[] = []

  constructor(
    readonly key: string,
    protected ctx: SceneContext,
    opts: SceneOptions,
  ) {
    this.viewport = new Viewport(opts.width, opts.height, opts.maxZoom, opts.initial)
    this.root.addChild(this.viewport.content)
  }

  get content() {
    return this.viewport.content
  }

  /** 加入熱區；有 hint 的畫出描邊（呼吸閃爍），有 fog 的蓋上霧罩 */
  protected addHotspots(list: Hotspot[], layer: Container = this.content) {
    for (const spot of list) {
      this.hotspots.push({ spot, shape: new Polygon(spot.poly) })
      if (spot.fog) {
        const fog = new Graphics().poly(spot.poly).fill({ color: 0xf4f1ea, alpha: 0.55 })
        layer.addChild(fog)
        this.ambient(gsap.to(fog, { alpha: 0.75, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
      }
      if (spot.hint) {
        const g = new Graphics()
          .poly(spot.poly)
          .fill({ color: 0xffe9a8, alpha: 0.12 })
          .stroke({ color: 0xffd36b, width: 4, alpha: 0.95, join: 'round' })
        g.alpha = 0.35
        layer.addChild(g)
        this.ambient(gsap.to(g, { alpha: 1, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
      }
    }
  }

  /** 載入並擺放 Live2D 角色；同場景兩人會互相看向對方，點擊範圍優先於其他熱區 */
  protected async addCharacters(slots: CharacterSlot[]) {
    const chars = await Promise.all(slots.map((s) => Character.create(characterById(s.id)!, this.content, this.ctx.app.renderer)))
    chars.forEach((c, i) => {
      const slot = slots[i]
      ;(slot.layer ?? this.content).addChild(c.model)
      c.place(slot.x, slot.top, slot.height)
      c.partner = chars[(i + 1) % chars.length] === c ? null : chars[(i + 1) % chars.length]
      const spot = c.hotspot(() => this.ctx.openStudent(c.def.id))
      this.hotspots.unshift({ spot, shape: new Polygon(spot.poly) })
      c.warmUp()
      c.start(this.ctx.motion())
    })
    this.characters = chars
  }

  onTap(sx: number, sy: number) {
    const p = this.viewport.toContent(sx, sy)
    const hit = this.hotspots.find((h) => h.shape.contains(p.x, p.y))?.spot
    this.ripple(p.x, p.y)
    if (!hit) return
    if (hit.action) hit.action()
    else if (hit.to) this.ctx.navigate(hit.to, { x: sx, y: sy })
    else if (hit.msg) this.ctx.toast(hit.msg)
  }

  private ripple(x: number, y: number) {
    const r = new Graphics().circle(0, 0, 24).stroke({ color: 0xffffff, width: 3 })
    r.position.set(x, y)
    r.scale.set(0.3 / this.viewport.zoom)
    this.content.addChild(r)
    gsap.to(r.scale, { x: 1.4 / this.viewport.zoom, y: 1.4 / this.viewport.zoom, duration: 0.45, ease: 'power2.out' })
    gsap.to(r, { alpha: 0, duration: 0.45, ease: 'power1.in', onComplete: () => r.destroy() })
  }

  /** 註冊環境動畫：動畫關閉時暫停，場景銷毀時一併清除 */
  protected ambient<T extends gsap.core.Animation>(t: T): T {
    this.ambientTweens.push(t)
    if (!this.ctx.motion()) t.pause()
    return t
  }

  setMotion(on: boolean) {
    for (const t of this.ambientTweens) on ? t.resume() : t.pause()
    for (const c of this.characters) c.setMotion(on)
  }

  update(dt: number, _time: number) {
    if (!this.ctx.motion()) return
    const step = Math.min(dt, 100)
    for (const c of this.characters) c.update(step)
  }

  destroy() {
    for (const t of this.ambientTweens) t.kill()
    this.ambientTweens = []
    for (const c of this.characters) c.destroy()
    gsap.killTweensOf(this.root)
    gsap.killTweensOf(this.root.scale)
    this.root.destroy({ children: true })
  }
}

export { rand, rect } from './util'
