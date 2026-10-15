import { Container, Graphics, Text } from 'pixi.js'
import gsap from 'gsap'
import { rand } from '../stage/BaseScene'

// 室內／街景在正式素材到位前，用程式畫的占位圖。
// 樹木示範「分層素材」的做法：樹冠是獨立物件，以樹幹頂端為軸心擺動。

export const FONT = '"Noto Serif TC", "PingFang TC", "Songti TC", serif'

export function label(text: string, size: number, color = 0x3b3326, weight: 'normal' | 'bold' = 'bold') {
  const t = new Text({ text, style: { fontFamily: FONT, fontSize: size, fill: color, fontWeight: weight } })
  t.anchor.set(0.5)
  return t
}

/** 垂直漸層（以色帶疊出，避免依賴特定版本的漸層 API） */
export function vGradient(g: Graphics, x: number, y: number, w: number, h: number, top: number, bottom: number, steps = 24) {
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const c =
      (lerp(top >> 16, bottom >> 16, t) << 16) |
      (lerp((top >> 8) & 255, (bottom >> 8) & 255, t) << 8) |
      lerp(top & 255, bottom & 255, t)
    g.rect(x, y + (h * i) / steps, w, h / steps + 1).fill(c)
  }
  return g
}

export interface Tree {
  node: Container
  canopy: Container
}

export function tree(x: number, baseY: number, size: number, palette = [0x4f8a4a, 0x6aa35a, 0x88bb6a]): Tree {
  const node = new Container()
  node.position.set(x, baseY)
  const trunk = new Graphics().roundRect(-size * 0.09, -size * 0.9, size * 0.18, size * 0.9, 6).fill(0x7a5536)
  const canopy = new Container()
  canopy.position.set(0, -size * 0.85)
  const g = new Graphics()
  const blobs = [
    [0, -size * 0.35, size * 0.5],
    [-size * 0.32, -size * 0.12, size * 0.36],
    [size * 0.32, -size * 0.12, size * 0.36],
    [0, -size * 0.7, size * 0.34],
  ]
  blobs.forEach(([bx, by, r], i) => g.circle(bx, by, r).fill(palette[i % palette.length]))
  g.circle(-size * 0.12, -size * 0.5, size * 0.12).fill({ color: 0xffffff, alpha: 0.12 })
  canopy.addChild(g)
  node.addChild(trunk, canopy)
  return { node, canopy }
}

/** 樹冠擺動：只旋轉樹冠、幅度小、每棵節奏不同 */
export function sway(t: Tree, amount = 0.04) {
  t.canopy.rotation = -amount
  return gsap.to(t.canopy, {
    rotation: amount,
    duration: rand(1.8, 2.8),
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    delay: rand(0, 1.5),
  })
}

/** 飄落的葉子 */
export function leaf(parent: Container, area: { x: number; y: number; w: number; h: number }) {
  const g = new Graphics().ellipse(0, 0, 9, 4).fill(0x8cbf5f)
  parent.addChild(g)
  const tl = gsap.timeline({ repeat: -1, delay: rand(0, 6), repeatDelay: rand(1, 5) })
  tl.call(() => {
    g.position.set(area.x + rand(0, area.w), area.y)
    g.alpha = 1
  })
  tl.to(g, { y: area.y + area.h, duration: rand(6, 9), ease: 'none' }, 0)
  tl.to(g, { x: `+=${rand(-120, 120)}`, duration: rand(6, 9), ease: 'sine.inOut' }, 0)
  tl.to(g, { rotation: rand(4, 8), duration: rand(6, 9), ease: 'none' }, 0)
  tl.to(g, { alpha: 0, duration: 1 }, '>-1')
  return tl
}
