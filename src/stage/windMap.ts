import { Geometry, Mesh, Shader, Texture } from 'pixi.js'

/**
 * 從底圖自動推算效果遮罩（POC 用；正式版由美術繪製灰階 mask）：
 *   R = 樹冠（偏暗、偏綠的像素）→ 樹葉擺動
 *   G = 水面（明顯偏藍的像素）→ 水面波光
 * 以 1/3 解析度產生，貼圖線性取樣時自然會有柔邊。
 */
const maskCache = new Map<string, Texture>()

export function effectMask(key: string, tex: Texture): Texture {
  const hit = maskCache.get(key)
  if (hit) return hit
  const src = tex.source.resource as CanvasImageSource
  const w = Math.round(tex.width / 3)
  const h = Math.round(tex.height / 3)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d', { willReadFrequently: true })!
  c.drawImage(src, 0, 0, w, h)
  const img = c.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 510
    const tree = g > r + 12 && g > b + 6 && l < 0.52 ? Math.min(1, (0.56 - l) * 7) : 0
    const water = b > r + 40 && b > g + 4 && l > 0.38 ? 1 : 0
    d[i] = tree * 255
    d[i + 1] = water * 255
    d[i + 2] = 0
    d[i + 3] = 255
  }
  c.putImageData(img, 0, 0)
  const mask = Texture.from(canvas)
  maskCache.set(key, mask)
  return mask
}

const vertex = /* glsl */ `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}`

const fragment = /* glsl */ `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform sampler2D uMask;
uniform float uTime;
uniform float uWind;
uniform float uWater;
void main() {
  vec4 m = texture(uMask, vUV);
  float t = uTime;
  // 緩慢掃過整張圖的陣風，讓擺動不是全部同步
  float gust = 0.55 + 0.45 * sin(t * 0.6 + vUV.x * 5.0 - vUV.y * 3.0);
  vec2 off = vec2(
    sin(t * 1.7 + vUV.y * 70.0 + vUV.x * 35.0),
    0.4 * cos(t * 1.3 + vUV.x * 60.0)
  ) * uWind * m.r * gust;
  vec4 col = texture(uTexture, vUV + off);
  float wave = sin(vUV.y * 240.0 - t * 2.0 + sin(vUV.x * 60.0 + t * 0.7) * 2.5);
  col.rgb += m.g * smoothstep(0.8, 1.0, wave) * uWater;
  finalColor = col;
}`

export interface WindMap {
  mesh: Mesh<Geometry, Shader>
  update(time: number, motion: boolean): void
}

/** 一張底圖 + 一個 shader，整張圖一次 draw call 完成樹葉擺動與水面波光 */
export function createWindMap(tex: Texture, mask: Texture, opts: { wind: number; water: number }): WindMap {
  const w = tex.width
  const h = tex.height
  const geometry = new Geometry({
    attributes: {
      aPosition: [0, 0, w, 0, w, h, 0, h],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  })
  const shader = Shader.from({
    gl: { vertex, fragment },
    resources: {
      uTexture: tex.source,
      uMask: mask.source,
      fx: {
        uTime: { value: 0, type: 'f32' },
        uWind: { value: opts.wind, type: 'f32' },
        uWater: { value: opts.water, type: 'f32' },
      },
    },
  })
  const mesh = new Mesh({ geometry, shader })
  const u = shader.resources.fx.uniforms
  return {
    mesh,
    update(time, motion) {
      u.uTime = time
      u.uWind = motion ? opts.wind : 0
      u.uWater = motion ? opts.water : 0
    },
  }
}
