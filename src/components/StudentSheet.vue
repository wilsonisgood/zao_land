<script setup lang="ts">
import { computed, ref } from 'vue'
import { characterById } from '../data/characters'

const props = defineProps<{ id: string }>()
defineEmits<{ close: [] }>()

const s = computed(() => characterById(props.id)!)
const picked = ref<number | null>(null)
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0')
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="s.name">
      <div class="handle" />
      <header>
        <div class="avatar" :style="{ background: hex(s.color) }">
          <i :style="{ background: hex(s.hair) }" />
        </div>
        <div>
          <h2>{{ s.name }}</h2>
          <p class="muted">{{ s.desc }}</p>
        </div>
      </header>
      <p class="line">「{{ s.line }}」</p>
      <template v-if="picked === null">
        <button v-for="(c, i) in s.choices" :key="i" class="choice" @click="picked = i">{{ c.text }}</button>
      </template>
      <template v-else>
        <p class="me">你：{{ s.choices[picked].text }}</p>
        <p class="line">「{{ s.choices[picked].reply }}」</p>
        <button class="choice primary" @click="$emit('close')">揮手道別</button>
      </template>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: #0006;
  z-index: 30;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: var(--paper);
  color: var(--ink);
  border-radius: 22px 22px 0 0;
  padding: 10px 20px calc(24px + env(safe-area-inset-bottom));
  box-shadow: 0 -8px 30px #0005;
}
.handle {
  width: 40px;
  height: 5px;
  border-radius: 3px;
  background: #0002;
  margin: 0 auto 14px;
}
header {
  display: flex;
  gap: 14px;
  align-items: center;
}
.avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  flex: none;
}
.avatar i {
  position: absolute;
  inset: 0 0 60% 0;
}
h2 {
  margin: 0;
  font-size: 20px;
}
.muted {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.line {
  font-size: 16px;
  line-height: 1.75;
  margin: 16px 0;
}
.me {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}
.choice {
  display: block;
  width: 100%;
  text-align: left;
  padding: 13px 16px;
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid #0002;
  background: #fff8;
  color: inherit;
  font: inherit;
  font-size: 15px;
}
.choice.primary {
  text-align: center;
  background: var(--accent);
  color: #fff;
  border: 0;
}
</style>
