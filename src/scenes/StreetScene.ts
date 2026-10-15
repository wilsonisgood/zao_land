import { Container, Graphics } from 'pixi.js'
import gsap from 'gsap'
import { BaseScene, rect } from '../stage/BaseScene'
import type { SceneContext } from '../stage/types'
import { label, leaf, sway, tree, vGradient } from './draw'

const W = 1800
const H = 1334
const GROUND = 900

const halls = [
  { id: 'tech', name: '科技學院', x: 120, roof: 0x3d5a80, body: 0xe8e2d0, mark: '⚙', to: undefined },
  { id: 'lit', name: '文學院', x: 680, roof: 0x8a4b3a, body: 0xf0e6d2, mark: '✒', to: undefined },
  { id: 'math', name: '數理學院', x: 1240, roof: 0x2f5d50, body: 0xece4cf, mark: '∑', to: '/world/warm/academy/math' },
]

/** 映河書院 · 書院大街：橫向長卷，可左右拖曳 */
export class StreetScene extends BaseScene {
  readonly ready: Promise<this>

  constructor(ctx: SceneContext) {
    super('street', ctx, { width: W, height: H, maxZoom: 1.8, initial: { cx: 900, cy: 700, zoom: 1 } })
    const c = this.content
    const bg = vGradient(new Graphics(), 0, 0, W, GROUND, 0xbcd9e8, 0xf6ead2)
    bg.ellipse(300, GROUND, 520, 160).fill(0xa9c79a)
    bg.ellipse(1300, GROUND, 700, 200).fill(0x9dbf8e)
    c.addChild(bg)

    // 遠方的雲（環境動畫：緩慢平移）
    for (let i = 0; i < 4; i++) {
      const cloud = new Graphics()
        .ellipse(0, 0, 90, 26).fill({ color: 0xffffff, alpha: 0.75 })
        .ellipse(50, -14, 60, 22).fill({ color: 0xffffff, alpha: 0.75 })
      cloud.position.set(200 + i * 460, 120 + (i % 2) * 90)
      c.addChild(cloud)
      this.ambient(gsap.to(cloud, { x: `+=${160 + i * 30}`, duration: 26 + i * 6, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    }

    const gate = label('映河書院 · 書院大街', 44, 0x4a3a28)
    gate.position.set(W / 2, 290)
    c.addChild(gate)

    // 石板路
    const road = new Graphics().rect(0, GROUND, W, H - GROUND).fill(0xcbb79a)
    for (let y = GROUND + 40; y < H; y += 60) road.moveTo(0, y).lineTo(W, y).stroke({ color: 0xb29d7f, width: 3 })
    for (let y = GROUND; y < H; y += 60)
      for (let x = ((y / 60) % 2) * 50; x < W; x += 100) road.moveTo(x, y).lineTo(x, y + 60).stroke({ color: 0xb29d7f, width: 2 })
    c.addChild(road)

    for (const hall of halls) c.addChild(this.building(hall))

    for (const [x, s] of [[40, 230], [620, 260], [1180, 250], [1760, 230]] as const) {
      const t = tree(x, GROUND + 10, s)
      c.addChild(t.node)
      this.ambient(sway(t))
    }

    const leaves = new Container()
    c.addChild(leaves)
    for (let i = 0; i < 8; i++) this.ambient(leaf(leaves, { x: 0, y: 380, w: W, h: 800 }))

    this.addHotspots(
      halls.map((h) => ({
        id: h.id,
        label: h.name,
        poly: rect(h.x, 400, 440, 500),
        to: h.to,
        hint: !!h.to,
        msg: h.to ? undefined : `${h.name}：POC 只做了數理學院`,
      })),
    )
    ctx.toast('左右拖曳看看大街')
    this.ready = this.addCharacters([
      { id: 'mingzhi', x: 690, top: 620, height: 1050 },
      { id: 'qinglan', x: 1120, top: 660, height: 990 },
    ]).then(() => this)
  }

  private building(h: (typeof halls)[number]) {
    const g = new Graphics()
    const { x } = h
    g.rect(x, 520, 440, GROUND - 520).fill(h.body).stroke({ color: 0x8a7a62, width: 3 })
    g.poly([x - 30, 530, x + 220, 380, x + 470, 530]).fill(h.roof)
    for (const wx of [x + 40, x + 330]) {
      g.roundRect(wx, 570, 70, 90, 30).fill(0x6f8fa6).stroke({ color: 0xfff6e4, width: 6 })
      g.roundRect(wx, 690, 70, 90, 30).fill(0x6f8fa6).stroke({ color: 0xfff6e4, width: 6 })
    }
    g.roundRect(x + 175, 730, 90, 170, 44).fill(0x5a4130)
    g.circle(x + 245, 820, 6).fill(0xe8c26a)
    g.roundRect(x + 120, 664, 200, 50, 8).fill(0x3e3226)
    const container = new Container()
    container.addChild(g)
    const name = label(h.name, 30, 0xf3e3b8)
    name.position.set(x + 220, 689)
    const mark = label(h.mark, 54, 0xffffff)
    mark.position.set(x + 220, 478)
    container.addChild(name, mark)
    return container
  }
}
