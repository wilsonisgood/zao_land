export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const rect = (x: number, y: number, w: number, h: number) => [x, y, x + w, y, x + w, y + h, x, y + h]
