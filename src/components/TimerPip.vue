<template>
  <button
    v-if="pip.isSupported"
    class="pip-toggle"
    :class="{ active: pip.isActive.value }"
    :aria-pressed="pip.isActive.value"
    :title="pip.isActive.value ? 'Fechar janela flutuante' : 'Abrir timer em janela flutuante'"
    :aria-label="pip.isActive.value ? 'Fechar janela flutuante' : 'Abrir timer em janela flutuante'"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="15" rx="3" />
      <rect class="inner" x="11.5" y="11" width="8" height="6" rx="1.5" />
    </svg>
  </button>

  <!-- Conteúdo renderizado dentro da janela PiP (modo documento) -->
  <Teleport v-if="pip.documentBody.value" :to="pip.documentBody.value">
    <div class="pip" :class="[`mode-${pomodoro.currentMode}`, { running: pomodoro.isRunning }]">
      <header class="pip-head">
        <span class="pip-chip">{{ modeIcon }} {{ pomodoro.getModeLabel() }}</span>
        <span v-if="pet" class="pip-pet" :title="pet.name" aria-hidden="true">{{ pet.emoji }}</span>
      </header>

      <time class="pip-time" role="timer">{{ pomodoro.formattedTime }}</time>

      <div class="pip-bar" aria-hidden="true">
        <div class="pip-fill" :style="{ width: pomodoro.progress * 100 + '%' }"></div>
      </div>

      <div class="pip-controls">
        <button
          class="pip-main"
          :class="{ paused: pomodoro.isRunning }"
          @click="pomodoro.isRunning ? pomodoro.pause() : pomodoro.start()"
        >
          <template v-if="pomodoro.isRunning"><span aria-hidden="true">❚❚</span> Pausar</template>
          <template v-else><span aria-hidden="true">▶</span> Iniciar</template>
        </button>
        <button class="pip-round" title="Resetar" aria-label="Resetar" @click="pomodoro.reset()">🔄</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue'
import { usePictureInPicture } from '../composables/usePictureInPicture'
import { drawTimerFrame, readThemeColors, FRAME_WIDTH, FRAME_HEIGHT } from '../pip/drawTimerFrame'

const props = defineProps({
  pomodoro: { type: Object, required: true },
  pet: { type: Object, default: null }
})

const emit = defineEmits(['error'])

const pip = usePictureInPicture()

const MODE_ICONS = { focus: '🎯', shortBreak: '☕', longBreak: '🌙' }
const modeIcon = computed(() => MODE_ICONS[props.pomodoro.currentMode])

// ---------- Fallback: timer desenhado em canvas ----------
let canvas = null

const drawFrame = () => {
  if (!canvas) return
  drawTimerFrame(canvas.getContext('2d'), {
    time: props.pomodoro.formattedTime,
    label: props.pomodoro.getModeLabel(),
    icon: modeIcon.value,
    mode: props.pomodoro.currentMode,
    progress: props.pomodoro.progress,
    running: props.pomodoro.isRunning,
    petEmoji: props.pet?.emoji
  }, readThemeColors())
  pip.requestFrame()
}

const openVideoPip = async () => {
  canvas = document.createElement('canvas')
  canvas.width = FRAME_WIDTH
  canvas.height = FRAME_HEIGHT
  drawFrame()
  await pip.openVideo(canvas, {
    play: () => props.pomodoro.start(),
    pause: () => props.pomodoro.pause()
  })
  pip.setPlaybackState(props.pomodoro.isRunning)
}

// Redesenha o canvas sempre que algo visível mudar
watch(
  () => [
    props.pomodoro.formattedTime,
    props.pomodoro.currentMode,
    props.pomodoro.isRunning,
    props.pet?.id
  ],
  () => {
    if (pip.mode.value !== 'video') return
    drawFrame()
    pip.setPlaybackState(props.pomodoro.isRunning)
  }
)

watch(pip.mode, (mode) => { if (mode !== 'video') canvas = null })

// ---------- Abrir / fechar ----------
const toggle = async () => {
  if (pip.isActive.value) return pip.close()

  try {
    if (pip.supportsDocument) {
      try {
        await pip.openDocument({ width: 300, height: 340 })
        return
      } catch (error) {
        if (!pip.supportsVideo) throw error
        console.warn('Document PiP falhou, usando vídeo PiP:', error)
      }
    }
    await openVideoPip()
  } catch (error) {
    console.error('Não foi possível abrir a janela flutuante:', error)
    emit('error', error)
  }
}

onBeforeUnmount(() => { if (pip.isActive.value) pip.close() })
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

// ---------- Botão na página ----------
.pip-toggle {
  @include chunky-icon-btn(2.6rem);

  svg {
    width: 1.35rem;
    height: 1.35rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
  }

  .inner { fill: currentColor; stroke: none; }

  &.active {
    @include chunky-btn($grape, $grape-deep, $ink-on-color);
    width: 2.6rem;
    height: 2.6rem;
    padding: 0;
  }
}

// ---------- Conteúdo dentro da janela PiP ----------
.pip {
  --mode: #{$tomato};
  --mode-deep: #{$tomato-deep};

  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
  height: 100vh;
  overflow: hidden;
  padding: 0.9rem;

  &.mode-shortBreak { --mode: #{$mint}; --mode-deep: #{$mint-deep}; }
  &.mode-longBreak { --mode: #{$sky}; --mode-deep: #{$sky-deep}; }
}

.pip-head {
  @include flex-between;
  gap: 0.5rem;
}

.pip-chip {
  @include chip(var(--mode), $ink-on-color);
  box-shadow: inset 0 -3px 0 var(--mode-deep), 0 2px 0 $outline;
  font-size: 0.85rem;
  border-width: $border-width;
  padding: 0.4em 0.9em;
}

.pip-pet {
  font-size: 2rem;
  line-height: 1;
  animation: pp-bob 2.6s ease-in-out infinite;
}

.pip-time {
  text-align: center;
  font-family: $font-numbers;
  font-weight: 900;
  // Acompanha o tamanho da janela, que o usuário pode redimensionar
  font-size: clamp(2.5rem, 24vw, 7rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: $ink;

  .running & { animation: pp-pulse 2s ease-in-out infinite; }
}

.pip-bar { @include progress-track(1rem); }

.pip-fill {
  @include progress-fill(var(--mode), var(--mode-deep));
  transition: width 400ms linear;
}

.pip-controls {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.pip-main {
  @include chunky-btn(var(--mode), var(--mode-deep));
  flex: 1;

  &.paused { @include chunky-btn($sun, $sun-deep); flex: 1; }
}

.pip-round { @include chunky-icon-btn(2.8rem); }
</style>
