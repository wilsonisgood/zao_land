import type { Container, Renderer } from 'pixi.js'
import gsap from 'gsap'
import { loadLive2D } from '../stage/live2d'
import { rand, rect } from '../stage/util'
import type { Hotspot } from '../stage/types'
import type { CharacterDef } from '../data/characters'

type Model = InstanceType<Awaited<ReturnType<typeof loadLive2D>>['Live2DModel']>

/**
 * 場景中的 Live2D 角色。
 * 自然感來自四層疊加：
 *   1. 待機動作（模型內建的 Idle，含呼吸、眨眼）
 *   2. 視線漂移：每隔幾秒換一個注視點（另一個角色／正前方／隨意看看），頭與身體跟著轉
 *   3. 物理：頭髮、衣服、飾品由 physics3.json 依頭身的動作自然擺動
 *   4. 偶爾的小動作，以及被點時的反應動作
 */
export class Character {
  private gazeTarget = { x: 0, y: 0 }
  private gaze = { x: 0, y: 0 }
  private ambientTweens: gsap.core.Animation[] = []
  /** 臉部大約的位置（場景內容座標） */
  face = { x: 0, y: 0 }
  partner: Character | null = null

  private constructor(
    readonly def: CharacterDef,
    readonly model: Model,
    private content: Container,
  ) {}

  static async create(def: CharacterDef, content: Container, renderer: Renderer) {
    const { Live2DModel } = await loadLive2D(renderer)
    const model = await Live2DModel.from(def.model, {
      autoUpdate: false,
      autoHitTest: false,
      autoFocus: false,
      // 以實際畫出來的範圍定位（各模型畫布留白不同，用畫布定位會高低不一）
      anchorMode: 'drawable',
      // 4096 的大貼圖依實際顯示大小產生較小的版本，省手機記憶體
      textureOptions: { lod: 'single-auto' },
    })
    const c = new Character(def, model, content)
    c.setupMotions()
    return c
  }

  /** 以頭頂為基準擺放；height 為角色（頭頂到腳底）在場景中的高度 */
  place(x: number, top: number, height: number) {
    const m = this.model
    m.scale.set(height / (m.height / m.scale.y))
    m.anchor.set(0.5, 0)
    m.position.set(x, top)
    this.face = { x: x + this.def.face[0] * height, y: top + this.def.face[1] * height }
    this.gaze = { ...this.face }
    this.gazeTarget = { x: this.face.x, y: this.face.y + 40 }
  }

  hotspot(onTap: () => void): Hotspot {
    const m = this.model
    const [l, t, w, h] = this.def.hit
    const H = m.height
    return {
      id: this.def.id,
      label: this.def.name,
      poly: rect(m.x + l * H, m.y + t * H, w * H, h * H),
      action: () => {
        this.react()
        onTap()
      },
    }
  }

  private setupMotions() {
    const mm = this.model.internalModel!.motionManager
    const { idle } = this.def
    // 指定待機動作來源（例如 Haru 受付版的動作都在同一個無名群組，只取第 0 個當待機）
    if (idle.indices) {
      const defs = mm.definitions as Record<string, unknown[] | undefined>
      const src = defs[idle.group] ?? []
      defs.__idle = idle.indices.map((i) => src[i]).filter(Boolean)
      mm.groups.idle = '__idle'
    } else {
      mm.groups.idle = idle.group
    }
  }

  /** 啟動環境行為（視線漂移、偶爾的小動作） */
  start(motion: boolean) {
    const lookLoop = () => {
      const roll = Math.random()
      if (this.partner && roll < 0.45) {
        this.gazeTarget = { x: this.partner.face.x, y: this.partner.face.y }
      } else if (roll < 0.75) {
        this.gazeTarget = { x: this.face.x + rand(-30, 30), y: this.face.y + rand(20, 80) } // 看向前方（鏡頭）
      } else {
        this.gazeTarget = { x: this.face.x + rand(-600, 600), y: this.face.y + rand(-250, 300) }
      }
      this.ambientTweens.push(gsap.delayedCall(rand(2.5, 6), lookLoop))
    }
    this.ambientTweens.push(gsap.delayedCall(rand(0.5, 2), lookLoop))

    const g = this.def.gesture
    if (g) {
      const gestureLoop = () => {
        const i = g.indices[Math.floor(Math.random() * g.indices.length)]
        this.model.motion(g.group, i, 2)
        this.ambientTweens.push(gsap.delayedCall(rand(14, 26), gestureLoop))
      }
      this.ambientTweens.push(gsap.delayedCall(rand(6, 14), gestureLoop))
    }
    this.setMotion(motion)
  }

  setMotion(on: boolean) {
    this.ambientTweens = this.ambientTweens.filter((t) => t.isActive() || t.paused() || t.progress() < 1)
    for (const t of this.ambientTweens) on ? t.resume() : t.pause()
  }

  private react() {
    const t = this.def.tap
    this.gazeTarget = { x: this.face.x, y: this.face.y + 60 }
    if (t) this.model.motion(t.group, t.indices[Math.floor(Math.random() * t.indices.length)], 3)
  }

  /** 進場前先跑約一秒：讓 pose（手臂切換）淡入完成、物理穩定，避免出場時看到殘影或頭髮彈跳 */
  warmUp() {
    for (let i = 0; i < 30; i++) this.update(33)
  }

  update(dt: number) {
    // 視線平滑追隨（比函式庫內建的 focus 更慢、更像人）
    const k = 1 - Math.pow(0.04, dt / 1000)
    this.gaze.x += (this.gazeTarget.x - this.gaze.x) * k
    this.gaze.y += (this.gazeTarget.y - this.gaze.y) * k
    const p = this.content.toGlobal(this.gaze)
    this.model.focus(p.x, p.y)
    this.model.update(dt)
  }

  destroy() {
    for (const t of this.ambientTweens) t.kill()
  }
}
