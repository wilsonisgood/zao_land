import { Assets } from 'pixi.js'
import { BaseScene, type SceneOptions } from '../stage/BaseScene'
import { createWindMap, effectMask, type WindMap } from '../stage/windMap'
import type { Hotspot, SceneContext } from '../stage/types'

/** 以一張插畫底圖為主的地圖場景（世界、區域） */
export class MapScene extends BaseScene {
  private wind!: WindMap

  static async create(
    key: string,
    ctx: SceneContext,
    url: string,
    spots: Hotspot[],
    opts: Omit<SceneOptions, 'width' | 'height'> & { wind: number; water: number },
  ) {
    const tex = await Assets.load(url)
    const scene = new MapScene(key, ctx, { ...opts, width: tex.width, height: tex.height })
    scene.wind = createWindMap(tex, effectMask(url, tex), opts)
    scene.content.addChild(scene.wind.mesh)
    scene.addHotspots(spots)
    return scene
  }

  update(_dt: number, time: number) {
    this.wind.update(time, this.ctx.motion())
  }
}
