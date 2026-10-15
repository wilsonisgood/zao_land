import type { Application, Container } from 'pixi.js'
import type { Viewport } from './Viewport'

export interface Point {
  x: number
  y: number
}

/** 可點擊區域。poly 為場景內容座標（底圖像素）的多邊形 [x0,y0,x1,y1,...] */
export interface Hotspot {
  id: string
  label: string
  poly: number[]
  /** 點擊後前往的路由 */
  to?: string
  /** 未開放或尚未製作時的提示 */
  msg?: string
  /** 自訂點擊行為（例如開啟同學互動） */
  action?: () => void
  /** 是否顯示可點擊提示的描邊 */
  hint?: boolean
  /** 未開放區域：覆蓋霧罩 */
  fog?: boolean
}

/** 場景與外部（Vue）溝通的介面 */
export interface SceneContext {
  app: Application
  navigate(path: string, from?: Point): void
  toast(msg: string): void
  openStudent(id: string): void
  motion(): boolean
}

export interface Scene {
  key: string
  /** 轉場時整體縮放 / 淡出用的外層容器 */
  root: Container
  viewport: Viewport
  onTap(sx: number, sy: number): void
  update(dt: number, time: number): void
  setMotion(on: boolean): void
  destroy(): void
}

export type SceneFactory = (ctx: SceneContext) => Promise<Scene>
