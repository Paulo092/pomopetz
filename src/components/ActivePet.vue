<template>
  <section class="pet-panel">
    <h2 class="ribbon">🐾 Seu Pet</h2>

    <div class="scene" :class="[`mood-${mood}`, pet ? pet.rarity : 'empty']">
      <span class="cloud c1" aria-hidden="true"></span>
      <span class="cloud c2" aria-hidden="true"></span>

      <template v-if="pet">
        <Transition name="bubble">
          <p v-if="bubble" :key="bubble" class="bubble">{{ bubble }}</p>
        </Transition>

        <button
          class="pet"
          :class="{ hopping }"
          :aria-label="`Fazer carinho em ${pet.name}`"
          @click="poke"
          @animationend="hopping = false"
        >
          <span class="pet-emoji">{{ pet.emoji }}</span>
        </button>
        <span class="pet-shadow" aria-hidden="true"></span>

        <span v-if="pet.rarity === 'legendary'" class="sparkles" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </template>

      <template v-else>
        <div class="egg" aria-hidden="true">🥚</div>
        <span class="pet-shadow" aria-hidden="true"></span>
      </template>

      <span class="hill" aria-hidden="true"></span>
    </div>

    <div v-if="pet" class="nameplate">
      <span class="pet-name">{{ pet.name }}</span>
      <span class="rarity" :class="pet.rarity">{{ rarityLabel }}</span>
    </div>
    <p v-else class="empty-text">Nenhum pet ainda — passe na <strong>Loja</strong> para chocar o primeiro!</p>
  </section>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  pet: { type: Object, default: null },
  // 'idle' | 'focus' | 'break'
  mood: { type: String, default: 'idle' }
})

const RARITY_LABELS = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' }
const rarityLabel = computed(() => RARITY_LABELS[props.pet?.rarity] || '???')

const POKE_LINES = [
  'Hehe, faz cócegas!',
  'Vamos focar juntos?',
  'Você consegue! ✨',
  'Mais um pomodoro? 🍅',
  'Tô com fome de moedas 🪙',
  '♥'
]

const MOOD_LINES = {
  focus: '📖 Focando...',
  break: '☕ Descansando~',
  idle: ''
}

const bubble = ref('')
const hopping = ref(false)
let bubbleTimer = null

const say = (text, duration = 2600) => {
  clearTimeout(bubbleTimer)
  bubble.value = text
  if (duration) bubbleTimer = setTimeout(() => { bubble.value = MOOD_LINES[props.mood] }, duration)
}

const poke = () => {
  hopping.value = false
  requestAnimationFrame(() => { hopping.value = true })
  say(POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)])
}

watch(() => props.mood, (mood) => say(MOOD_LINES[mood], 0), { immediate: true })

onUnmounted(() => clearTimeout(bubbleTimer))
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.pet-panel {
  @include panel($spacing-xl $spacing-md $spacing-md);
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.ribbon { @include ribbon($berry, $berry-deep); }

// ---------- Cenário ----------
.scene {
  position: relative;
  height: 220px;
  overflow: hidden;
  border: $border-width solid $outline;
  border-radius: $radius-lg;
  background: linear-gradient($scene-sky-top, $scene-sky-bottom 75%);
  isolation: isolate;
}

.hill {
  position: absolute;
  left: -15%;
  right: -15%;
  bottom: -62%;
  height: 100%;
  background: $scene-grass;
  border-top: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: inset 0 10px 0 color-mix(in srgb, white 25%, transparent);
  z-index: 0;
}

.cloud {
  position: absolute;
  width: 70px;
  height: 22px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: $radius-full;
  z-index: -1;
  animation: pp-cloud 38s linear infinite;

  &::before {
    content: '';
    position: absolute;
    left: 14px;
    top: -12px;
    width: 32px;
    height: 28px;
    background: inherit;
    border-radius: 50%;
  }

  &.c1 { top: 22px; left: 0; }
  &.c2 { top: 62px; left: 0; width: 50px; animation-duration: 55s; animation-delay: -30s; opacity: 0.7; }
}

.pet {
  position: absolute;
  left: 50%;
  bottom: 44px;
  z-index: 2;
  translate: -50% 0;
  cursor: pointer;
  border-radius: 50%;
}

.pet-emoji {
  display: block;
  font-size: 5.5rem;
  line-height: 1;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.15));
  animation: pp-bob 2.6s ease-in-out infinite;

  .mood-focus & { animation-duration: 4s; }
  .mood-break & { animation: pp-wiggle 1.4s ease-in-out infinite; }
}

.pet.hopping .pet-emoji { animation: pp-hop 560ms $ease-bounce; }

.pet-shadow {
  position: absolute;
  left: 50%;
  bottom: 36px;
  z-index: 1;
  width: 78px;
  height: 14px;
  background: #000;
  border-radius: 50%;
  animation: pp-shadow-bob 2.6s ease-in-out infinite;
}

.egg {
  position: absolute;
  left: 50%;
  bottom: 44px;
  z-index: 2;
  translate: -50% 0;
  font-size: 4.5rem;
  line-height: 1;
  animation: pp-wiggle 1.8s ease-in-out infinite;
}

// Balão de fala
.bubble {
  position: absolute;
  top: 14px;
  left: 50%;
  translate: -50% 0;
  z-index: 3;
  max-width: 80%;
  padding: 0.45rem 0.9rem;
  font-family: $font-display;
  font-weight: 500;
  font-size: $font-size-sm;
  white-space: nowrap;
  color: $ink;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-md;
  box-shadow: 0 $ledge-sm 0 $outline;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -9px;
    width: 12px;
    height: 12px;
    background: $surface;
    border-right: $border-width solid $outline;
    border-bottom: $border-width solid $outline;
    transform: translateX(-50%) rotate(45deg);
  }
}

.bubble-enter-active { animation: pp-pop-in 300ms $ease-bounce both; }
.bubble-leave-active { transition: opacity 150ms ease; }
.bubble-leave-to { opacity: 0; }

// Brilhos para lendários
.sparkles i {
  position: absolute;
  z-index: 3;
  width: 14px;
  height: 14px;
  background: $sun;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: pp-twinkle 1.8s ease-in-out infinite;

  &:nth-child(1) { left: 30%; bottom: 120px; }
  &:nth-child(2) { right: 28%; bottom: 150px; animation-delay: 0.6s; }
  &:nth-child(3) { right: 34%; bottom: 70px; animation-delay: 1.2s; width: 10px; height: 10px; }
}

// ---------- Placa de nome ----------
.nameplate {
  @include flex-between;
  gap: $spacing-sm;
  padding: 0.55rem 0.6rem 0.55rem 1rem;
  @include well($radius-full);
}

.pet-name {
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-xl;
  @include truncate;
}

.rarity {
  @include rarity-vars;
  @include chip(var(--r), $ink-on-color);
  box-shadow: inset 0 -2px 0 var(--r-deep);
  flex-shrink: 0;
}

.empty-text {
  text-align: center;
  color: $ink-soft;
  font-size: $font-size-sm;

  strong { color: $ink; }
}
</style>
