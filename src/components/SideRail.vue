<script setup lang="ts">
defineProps<{ depth: number }>()
defineEmits<{ world: []; up: []; zoom: [factor: number] }>()
</script>

<template>
  <nav class="rail" aria-label="地圖操作">
    <Transition name="fade">
      <div v-if="depth > 0" class="group">
        <button aria-label="回到世界地圖" @click="$emit('world')"><span>🌐</span><small>世界</small></button>
        <button aria-label="回到上一層" @click="$emit('up')"><span>↑</span><small>上一層</small></button>
      </div>
    </Transition>
    <div class="group">
      <button aria-label="放大" @click="$emit('zoom', 1.4)"><span>＋</span></button>
      <button aria-label="縮小" @click="$emit('zoom', 1 / 1.4)"><span>－</span></button>
    </div>
  </nav>
</template>

<style scoped>
.rail {
  position: fixed;
  right: calc(12px + env(safe-area-inset-right));
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}
.group {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: var(--glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px #0004;
}
button {
  width: 52px;
  min-height: 48px;
  border: 0;
  background: transparent;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font: inherit;
  cursor: pointer;
}
button + button {
  border-top: 1px solid #0001;
}
button:active {
  background: #0000000f;
}
span {
  font-size: 20px;
  line-height: 1;
}
small {
  font-size: 10px;
  color: var(--muted);
}
</style>
