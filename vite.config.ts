import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    rollupOptions: {
      // index.html：原型 App（今日、信件、收藏、我）；world.html：世界 tab 嵌入的地圖 POC
      input: {
        main: 'index.html',
        world: 'world.html',
      },
    },
  },
})
