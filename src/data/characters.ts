// 角色（名字、台詞皆為 POC 示意；外觀使用 Live2D 官方範例模型）
export interface MotionRef {
  group: string
  indices: number[]
}

export interface CharacterDef {
  id: string
  name: string
  desc: string
  color: number
  hair: number
  line: string
  choices: { text: string; reply: string }[]
  /** model3.json 路徑 */
  model: string
  /** 臉相對頭頂的位置（以角色高度為單位）：[水平偏移, 往下] */
  face: [number, number]
  /** 可點範圍（以角色高度為單位）：[左, 上, 寬, 高]，左相對中心、上相對頭頂 */
  hit: [number, number, number, number]
  /** 待機動作群組；indices 指定只用其中幾個 */
  idle: { group: string; indices?: number[] }
  /** 偶爾的小動作 */
  gesture?: MotionRef
  /** 被點時的反應 */
  tap?: MotionRef
}

const L = 'live2d/'

export const characters: CharacterDef[] = [
  // 書院大街
  {
    id: 'qinglan',
    name: '晴嵐',
    desc: '書院大街 · 書院接待',
    color: 0x3f4f6b,
    hair: 0x6b4a32,
    line: '歡迎來到映河書院！第一次來嗎？數理學院在大街最裡面，那棟綠屋頂的就是了。',
    choices: [
      { text: '謝謝妳，我自己逛逛。', reply: '好的～逛累了，文學院前面的長椅可以坐。' },
      { text: '書院平常都這麼安靜嗎？', reply: '上課時間是這樣。等鐘響，整條街都會熱鬧起來喔。' },
    ],
    model: L + 'haru_greeter/haru_greeter_t05.model3.json',
    face: [0, 0.08],
    hit: [-0.15, 0, 0.3, 0.92],
    idle: { group: '', indices: [0] },
    gesture: { group: '', indices: [1, 2, 3, 5, 8] },
    tap: { group: '', indices: [4, 6, 7] },
  },
  {
    id: 'mingzhi',
    name: '明執',
    desc: '文學院講師 · 正要去上課',
    color: 0x2e3440,
    hair: 0x2b2522,
    line: '嗯？旅人啊。今天的課在講「留白」——你覺得，沒寫出來的字，也算是一種回答嗎？',
    choices: [
      { text: '算吧，有時候沉默比較誠實。', reply: '說得好。下次來旁聽吧，後排有空位。' },
      { text: '我還不太懂。', reply: '不懂也沒關係。願意想，就已經在路上了。' },
    ],
    model: L + 'natori/natori_pro_t06.model3.json',
    face: [0, 0.08],
    hit: [-0.15, 0, 0.3, 0.92],
    idle: { group: 'Idle' },
    tap: { group: 'Tap', indices: [0] },
  },
  // 數理學院走廊
  {
    id: 'yuehe',
    name: '月禾',
    desc: '數理學院二年級 · 在走廊討論題目',
    color: 0x7a8fb0,
    hair: 0x9a6a4a,
    line: '我們在吵這題到底能不能用估算。你站哪一邊？',
    choices: [
      { text: '能估算就先估算。', reply: '看吧！先有個大概，再慢慢修正。' },
      { text: '我想聽你們兩個怎麼說。', reply: '哈哈，那你可能要聽很久喔。' },
    ],
    model: L + 'hiyori/hiyori_pro_t11.model3.json',
    face: [0, 0.08],
    hit: [-0.15, 0, 0.3, 0.92],
    idle: { group: 'Idle' },
    tap: { group: 'Tap', indices: [0, 1] },
  },
  {
    id: 'lianshuang',
    name: '蓮霜',
    desc: '數理學院助教 · 抱著一疊作業',
    color: 0x5a5f78,
    hair: 0xd8d2c6,
    line: '別擋走廊喔……啊，不是說你。學遠教室在左手邊第一間。',
    choices: [
      { text: '謝謝，我正要找它。', reply: '進去小聲一點，裡面在上水文課。' },
      { text: '需要幫忙拿作業嗎？', reply: '……那就麻煩你了。只拿上面那疊就好。' },
    ],
    // 原本是 Ren（Cubism 5.3 模型），目前引擎不支援，先借用 Haru 受付版
    model: L + 'haru_greeter/haru_greeter_t05.model3.json',
    face: [0, 0.08],
    hit: [-0.15, 0, 0.3, 0.92],
    idle: { group: '', indices: [0] },
    gesture: { group: '', indices: [9, 10, 11] },
    tap: { group: '', indices: [12, 13] },
  },
  // 學遠教室
  {
    id: 'linying',
    name: '林映',
    desc: '數理學院一年級 · 喜歡計算河水',
    color: 0x5b7fa6,
    hair: 0x3a2a20,
    line: '旅人？你也是來聽水文課的嗎？我剛算到一半……潤川今天的流量，比昨天多了一點點。',
    choices: [
      { text: '多了一點點，是好事嗎？', reply: '不一定喔。不過能注意到「一點點」的變化，我覺得是件好事。' },
      { text: '你喜歡算這些嗎？', reply: '嗯！數字不會說謊，可是它們也會慢慢改變。我喜歡看它們改變。' },
    ],
    model: L + 'haru/haru.model3.json',
    face: [0, 0.08],
    hit: [-0.15, 0, 0.3, 0.92],
    idle: { group: 'Idle' },
    tap: { group: 'Tap', indices: [0, 1, 2] },
  },
  {
    id: 'zhouhe',
    name: '周和',
    desc: '坐在窗邊 · 常常看著外面',
    color: 0x7a9a6a,
    hair: 0x5a3b2a,
    line: '老師說要專心……可是窗外那棵樹的葉子，一直在動。你看得到嗎？',
    choices: [
      { text: '看得到，風很溫柔。', reply: '對吧！我覺得注意到這些，也是一種專心。' },
      { text: '下課再一起看吧。', reply: '好～那我先把這題寫完。' },
    ],
    model: L + 'hiyori_free/hiyori_free_t08.model3.json',
    face: [0, 0.08],
    hit: [-0.15, 0, 0.3, 0.92],
    idle: { group: 'Idle' },
    tap: { group: 'Tap', indices: [0] },
  },
]

export const characterById = (id: string) => characters.find((c) => c.id === id)
