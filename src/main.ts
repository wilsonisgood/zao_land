import { createApp } from 'vue'
import { createPinia } from 'pinia'
import gsap from 'gsap'
import App from './App.vue'
import { router } from './router'
import './style.css'

// iOS Safari：避免整頁被雙指縮放
document.addEventListener('gesturestart', (e) => e.preventDefault())

// 轉場要依真實時間完成；預設的 lag smoothing 在掉幀或從背景回來時會把動畫拖得很長
gsap.ticker.lagSmoothing(0)

createApp(App).use(createPinia()).use(router).mount('#app')
