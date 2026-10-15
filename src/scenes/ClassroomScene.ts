import { Container, Graphics } from 'pixi.js'
import gsap from 'gsap'
import { BaseScene, type CharacterSlot } from '../stage/BaseScene'
import type { SceneContext } from '../stage/types'
import { label, sway, tree, vGradient } from './draw'

const W = 750
const H = 1334
const WALL = 560

const seats: { x: number; y: number; student?: string }[] = [
  { x: 200, y: 760 },
  { x: 470, y: 760, student: 'linying' },
  { x: 200, y: 980, student: 'zhouhe' },
  { x: 470, y: 980 },
  { x: 200, y: 1200 },
  { x: 470, y: 1200 },
]

/** 學遠教室：兩位 Live2D 同學坐在座位上，點同學開啟互動 */
export class ClassroomScene extends BaseScene {
  readonly ready: Promise<this>

  constructor(ctx: SceneContext) {
    super('classroom', ctx, { width: W, height: H, maxZoom: 1.6, initial: { cx: W / 2, cy: H / 2, zoom: 1 } })
    const c = this.content

    const room = new Graphics()
    room.rect(0, 0, W, WALL).fill(0xefe3c9)
    room.rect(0, WALL, W, H - WALL).fill(0xc9a57a)
    for (let y = WALL + 50; y < H; y += 70) room.moveTo(0, y).lineTo(W, y).stroke({ color: 0xb18c62, width: 2 })
    room.rect(0, WALL - 14, W, 14).fill(0xa8865e)
    room.roundRect(265, 130, 390, 240, 10).fill(0x2f4a3a).stroke({ color: 0x8a6a48, width: 12 })
    c.addChild(room)
    const board1 = label('潤川流量的估算', 34, 0xf2efe4)
    board1.position.set(460, 205)
    const board2 = label('Q = A × v', 40, 0xf7e7a8, 'normal')
    board2.position.set(460, 285)
    const sign = label('學遠教室', 26, 0x5a4632)
    sign.position.set(460, 420)
    c.addChild(board1, board2, sign)

    c.addChild(this.window())

    // 每個座位：椅背 → 角色 → 桌子（含擋板），由後排往前排疊，前排自然遮住後排
    const slots: CharacterSlot[] = []
    for (const seat of seats) {
      const chair = new Graphics().roundRect(seat.x - 55, seat.y - 95, 110, 95, 14).fill(0x9a7146)
      c.addChild(chair)
      if (seat.student) {
        // Live2D 不吃 Pixi 的 stencil 遮罩，改用桌子的前擋板蓋住下半身（也比遮罩省）
        const layer = new Container()
        c.addChild(layer)
        slots.push({ id: seat.student, x: seat.x, top: seat.y - 240, height: 600, layer })
      }
      const desk = new Graphics()
      desk.rect(seat.x - 118, seat.y + 40, 236, Math.min(280, H - seat.y - 40)).fill(0xa47a4d) // 前擋板
      desk.roundRect(seat.x - 122, seat.y - 4, 244, 66, 10).fill(0xb88a5a)
      desk.rect(seat.x - 122, seat.y + 46, 244, 16).fill(0x9a7146)
      if (seat.student) desk.rect(seat.x - 30, seat.y + 2, 60, 40).fill(0xfbf7ec)
      c.addChild(desk)
    }

    this.ready = this.addCharacters(slots).then(() => {
      this.bubbles()
      return this
    })
  }

  /** 窗外的樹：分層素材的擺動示範，用遮罩限制在窗框內 */
  private window() {
    const node = new Container()
    const x = 85, y = 120, w = 150, h = 320
    const view = new Container()
    view.addChild(vGradient(new Graphics(), x, y, w, h, 0xa9d3ea, 0xe6f2df))
    const t = tree(x + 95, y + h + 40, 240)
    view.addChild(t.node)
    this.ambient(sway(t, 0.06))
    const mask = new Graphics().rect(x, y, w, h).fill(0xffffff)
    view.mask = mask
    const frame = new Graphics()
      .rect(x, y, w, h).stroke({ color: 0xfaf4e6, width: 12 })
      .moveTo(x + w / 2, y).lineTo(x + w / 2, y + h).stroke({ color: 0xfaf4e6, width: 8 })
      .moveTo(x, y + h / 2).lineTo(x + w, y + h / 2).stroke({ color: 0xfaf4e6, width: 8 })
    node.addChild(view, mask, frame)
    return node
  }

  /** 偶爾在某位同學頭上冒出「…」，暗示可以互動 */
  private bubbles() {
    const bubble = new Container()
    const g = new Graphics().roundRect(-34, -22, 68, 44, 18).fill(0xffffff).poly([-6, 20, 6, 20, -10, 34]).fill(0xffffff)
    const dots = label('…', 28, 0x5a4632)
    dots.position.set(0, -6)
    bubble.addChild(g, dots)
    bubble.alpha = 0
    this.content.addChild(bubble)
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5, delay: 1 })
    tl.call(() => {
      const ch = this.characters[Math.floor(Math.random() * this.characters.length)]
      bubble.position.set(ch.face.x + 70, ch.face.y - 90)
      bubble.scale.set(0.6)
    })
    tl.to(bubble, { alpha: 1, duration: 0.25 })
    tl.to(bubble.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' }, '<')
    tl.to(bubble, { alpha: 0, duration: 0.3, delay: 1.6 })
    this.ambient(tl)
  }
}
