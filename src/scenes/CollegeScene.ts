import { Graphics } from 'pixi.js'
import gsap from 'gsap'
import { BaseScene } from '../stage/BaseScene'
import type { SceneContext } from '../stage/types'
import { label } from './draw'

const W = 750
const H = 1334
// 一點透視的走廊：遠端牆面
const BX0 = 225, BX1 = 525, BY0 = 350, BY1 = 650

// 左牆在 x 處的頂端與地面 y
const leftTop = (x: number) => (BY0 * x) / BX0
const leftFloor = (x: number) => H - ((H - BY1) * x) / BX0

/** 左牆上的門（右牆用鏡射） */
function doorPoly(x0: number, x1: number, mirror: boolean) {
  const h = (x: number) => (leftFloor(x) - leftTop(x)) * 0.62
  const pts = [x0, leftFloor(x0), x1, leftFloor(x1), x1, leftFloor(x1) - h(x1), x0, leftFloor(x0) - h(x0)]
  return mirror ? pts.map((v, i) => (i % 2 === 0 ? W - v : v)) : pts
}

const doors = [
  { id: 'xueyuan', name: '學遠教室', x0: 80, x1: 165, mirror: false, to: '/world/warm/academy/math/classroom' },
  { id: 'calc', name: '演算室', x0: 180, x1: 212, mirror: false },
  { id: 'star', name: '星象觀測室', x0: 80, x1: 165, mirror: true },
  { id: 'archive', name: '資料室', x0: 180, x1: 212, mirror: true },
]

/** 數理學院 · 走廊 */
export class CollegeScene extends BaseScene {
  readonly ready: Promise<this>

  constructor(ctx: SceneContext) {
    super('college', ctx, { width: W, height: H, maxZoom: 1.6, initial: { cx: W / 2, cy: H / 2, zoom: 1 } })
    const g = new Graphics()
    g.poly([0, 0, W, 0, BX1, BY0, BX0, BY0]).fill(0xe9dcc0) // 天花板
    g.poly([0, 0, BX0, BY0, BX0, BY1, 0, H]).fill(0xd9c7a2) // 左牆
    g.poly([W, 0, BX1, BY0, BX1, BY1, W, H]).fill(0xd2bf98) // 右牆
    g.poly([0, H, BX0, BY1, BX1, BY1, W, H]).fill(0xa98a64) // 地板
    g.rect(BX0, BY0, BX1 - BX0, BY1 - BY0).fill(0xf1e6cc) // 遠端牆
    g.roundRect(BX0 + 90, BY0 + 60, 120, 170, 60).fill(0xbfe0ef).stroke({ color: 0xffffff, width: 6 })
    // 地板磚縫（往消失點收斂）
    for (let i = 0; i <= 8; i++) {
      const fx = (W * i) / 8
      g.moveTo(fx, H).lineTo(BX0 + ((BX1 - BX0) * i) / 8, BY1).stroke({ color: 0x8f734f, width: 2 })
    }
    this.content.addChild(g)

    // 天花板吊燈的光暈（環境動畫：緩慢明暗）
    for (const [x, y, r] of [[375, 120, 110], [375, 260, 60]] as const) {
      const glow = new Graphics().circle(x, y, r).fill({ color: 0xfff1c2, alpha: 0.5 })
      const lamp = new Graphics().circle(x, y, r * 0.18).fill(0xffe39a)
      this.content.addChild(glow, lamp)
      this.ambient(gsap.to(glow, { alpha: 0.25, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }))
    }

    const title = label('數理學院', 40, 0x4a3a28)
    title.position.set(W / 2, BY0 + 280)
    this.content.addChild(title)

    for (const d of doors) {
      const poly = doorPoly(d.x0, d.x1, d.mirror)
      const door = new Graphics().poly(poly).fill(d.to ? 0x6b4a33 : 0x7d5d44).stroke({ color: 0x4a3324, width: 4 })
      this.content.addChild(door)
      const cx = (poly[0] + poly[2]) / 2
      const top = Math.min(poly[5], poly[7])
      const plate = label(d.name, d.x1 - d.x0 > 60 ? 24 : 15, 0x3b3326)
      plate.position.set(cx, top - 26)
      this.content.addChild(plate)
    }

    this.addHotspots(
      doors.map((d) => ({
        id: d.id,
        label: d.name,
        poly: doorPoly(d.x0, d.x1, d.mirror),
        to: d.to,
        hint: !!d.to,
        msg: d.to ? undefined : `${d.name}：POC 只做了學遠教室`,
      })),
    )
    this.ready = this.addCharacters([
      { id: 'yuehe', x: 290, top: 540, height: 640 },
      { id: 'lianshuang', x: 465, top: 540, height: 650 },
    ]).then(() => this)
  }
}
