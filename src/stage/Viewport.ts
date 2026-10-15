import { Container } from 'pixi.js'

export interface CameraState {
  /** 畫面中心對應的內容座標 */
  cx: number
  cy: number
  /** 相對最小縮放（cover）的倍率，1 = 剛好鋪滿螢幕 */
  zoom: number
}

/**
 * 單一場景內的鏡頭：拖曳、雙指縮放、慣性、邊界限制。
 * 內容永遠鋪滿螢幕（cover），不會露出底色。
 */
export class Viewport {
  readonly content = new Container()
  private scale = 1
  private x = 0
  private y = 0
  private minScale = 1
  private screenW = 1
  private screenH = 1
  private vx = 0
  private vy = 0

  constructor(
    readonly contentW: number,
    readonly contentH: number,
    readonly maxZoom: number,
    readonly initial: CameraState,
  ) {}

  layout(screenW: number, screenH: number, state?: CameraState) {
    const keep = state ?? (this.screenW > 1 ? this.getState() : this.initial)
    this.screenW = screenW
    this.screenH = screenH
    this.minScale = Math.max(screenW / this.contentW, screenH / this.contentH)
    this.setState(keep)
  }

  getState(): CameraState {
    return {
      cx: (this.screenW / 2 - this.x) / this.scale,
      cy: (this.screenH / 2 - this.y) / this.scale,
      zoom: this.scale / this.minScale,
    }
  }

  setState(s: CameraState) {
    this.scale = this.minScale * Math.min(this.maxZoom, Math.max(1, s.zoom))
    this.x = this.screenW / 2 - s.cx * this.scale
    this.y = this.screenH / 2 - s.cy * this.scale
    this.apply()
  }

  get zoom() {
    return this.scale / this.minScale
  }

  pan(dx: number, dy: number) {
    this.x += dx
    this.y += dy
    this.apply()
  }

  zoomAt(factor: number, sx: number, sy: number) {
    const next = Math.min(this.minScale * this.maxZoom, Math.max(this.minScale, this.scale * factor))
    const k = next / this.scale
    this.x = sx - (sx - this.x) * k
    this.y = sy - (sy - this.y) * k
    this.scale = next
    this.apply()
  }

  fling(vx: number, vy: number) {
    this.vx = vx
    this.vy = vy
  }

  stop() {
    this.vx = this.vy = 0
  }

  /** 慣性滑動；回傳是否仍在移動 */
  step(dt: number) {
    if (Math.abs(this.vx) < 0.01 && Math.abs(this.vy) < 0.01) {
      this.vx = this.vy = 0
      return false
    }
    this.pan(this.vx * dt, this.vy * dt)
    const decay = Math.pow(0.9, dt / 16)
    this.vx *= decay
    this.vy *= decay
    return true
  }

  toContent(sx: number, sy: number) {
    return { x: (sx - this.x) / this.scale, y: (sy - this.y) / this.scale }
  }

  private apply() {
    const w = this.contentW * this.scale
    const h = this.contentH * this.scale
    this.x = Math.min(0, Math.max(this.screenW - w, this.x))
    this.y = Math.min(0, Math.max(this.screenH - h, this.y))
    this.content.position.set(this.x, this.y)
    this.content.scale.set(this.scale)
  }
}
