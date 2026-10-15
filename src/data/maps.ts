import type { Hotspot } from '../stage/types'
import { rect } from '../stage/BaseScene'

// 熱區座標以 1000px 寬的預覽圖量測，再換算成原圖像素。
// 正式版改由設計在 Figma 疊在底圖上畫多邊形、匯出 SVG 後轉成這份資料。
const scale = (pts: number[], k: number) => pts.map((v) => Math.round(v * k))

const W = 842 / 1000
const SOON = '這個區域尚未開放（POC 只做了暖谷領）'

export const worldSpots: Hotspot[] = [
  {
    id: 'warm',
    label: '暖谷領',
    to: '/world/warm',
    hint: true,
    poly: scale([400, 395, 470, 400, 490, 440, 525, 455, 540, 520, 500, 545, 450, 548, 400, 540, 355, 522, 372, 470, 398, 440], W),
  },
  { id: 'mist', label: '霧港領', msg: SOON, fog: true, poly: scale([372, 100, 470, 88, 555, 112, 578, 170, 560, 240, 470, 252, 402, 232, 362, 180], W) },
  { id: 'red', label: '赤岩高地', msg: SOON, fog: true, poly: scale([592, 112, 700, 92, 790, 160, 800, 300, 742, 398, 662, 378, 602, 300, 572, 240], W) },
  { id: 'cape', label: '白浪岬', msg: SOON, fog: true, poly: scale([252, 92, 330, 102, 360, 182, 400, 236, 380, 300, 300, 322, 205, 302, 212, 182], W) },
  { id: 'moon', label: '月礦山', msg: SOON, fog: true, poly: scale([402, 262, 560, 252, 648, 330, 655, 390, 560, 448, 492, 438, 470, 400, 382, 382, 372, 322], W) },
  { id: 'forest', label: '青森嶺', msg: SOON, fog: true, poly: scale([202, 322, 380, 312, 392, 420, 358, 520, 330, 560, 240, 560, 182, 480, 182, 380], W) },
  { id: 'plain', label: '雲原', msg: SOON, fog: true, poly: scale([540, 520, 560, 452, 660, 402, 742, 422, 780, 552, 722, 640, 500, 690, 332, 662, 292, 602, 362, 560, 450, 552, 500, 548], W) },
]

const V = 1254 / 1000
const TODO = (name: string) => `${name}：POC 尚未製作內部場景`

export const warmSpots: Hotspot[] = [
  { id: 'academy', label: '映河書院', to: '/world/warm/academy', hint: true, poly: scale(rect(588, 495, 108, 85), V) },
  { id: 'town', label: '映川鎮', msg: TODO('映川鎮'), poly: scale(rect(395, 465, 150, 140), V) },
  { id: 'tea', label: '茶露舖', msg: TODO('茶露舖'), poly: scale(rect(225, 442, 100, 90), V) },
  { id: 'post', label: '微光郵舍', msg: TODO('微光郵舍'), poly: scale(rect(232, 552, 105, 90), V) },
  { id: 'travel', label: '尋風旅會', msg: TODO('尋風旅會'), poly: scale(rect(692, 598, 130, 88), V) },
  { id: 'spring', label: '泉霧庄', msg: TODO('泉霧庄'), poly: scale(rect(468, 195, 145, 90), V) },
]
