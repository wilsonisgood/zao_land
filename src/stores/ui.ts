import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUi = defineStore('ui', () => {
  const toast = ref('')
  const studentId = ref<string | null>(null)
  const motion = ref(!matchMedia('(prefers-reduced-motion: reduce)').matches)
  let timer = 0

  function showToast(msg: string) {
    toast.value = msg
    clearTimeout(timer)
    timer = window.setTimeout(() => (toast.value = ''), 2200)
  }

  return { toast, studentId, motion, showToast }
})
