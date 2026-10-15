import type { SceneFactory } from '../stage/types'
import { worldSpots, warmSpots } from '../data/maps'
import { MapScene } from './MapScene'
import { StreetScene } from './StreetScene'
import { CollegeScene } from './CollegeScene'
import { ClassroomScene } from './ClassroomScene'

// 場景登錄表：路由 meta.scene → 建立場景
export const sceneFactories: Record<string, SceneFactory> = {
  world: (ctx) =>
    MapScene.create('world', ctx, 'maps/continent.jpg', worldSpots, {
      maxZoom: 2.5,
      initial: { cx: 379, cy: 396, zoom: 1 },
      wind: 0.0025,
      water: 0.05,
    }),
  warm: (ctx) =>
    MapScene.create('warm', ctx, 'maps/warmvalley.jpg', warmSpots, {
      maxZoom: 3,
      initial: { cx: 780, cy: 677, zoom: 1.3 },
      wind: 0.0022,
      water: 0.09,
    }),
  street: (ctx) => new StreetScene(ctx).ready,
  college: (ctx) => new CollegeScene(ctx).ready,
  classroom: (ctx) => new ClassroomScene(ctx).ready,
}
