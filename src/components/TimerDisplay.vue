<template>
  <div class="timer" :class="`mode-${pomodoro.currentMode}`">
    <h2 class="ribbon">{{ modeIcon }} {{ pomodoro.getModeLabel() }}</h2>

    <!-- Seletor de modo -->
    <div class="modes" role="radiogroup" aria-label="Modo do temporizador">
      <button
        v-for="mode in Object.values(pomodoro.MODES)"
        :key="mode"
        role="radio"
        class="mode-btn"
        :class="[`is-${mode}`, { active: pomodoro.currentMode === mode }]"
        :aria-checked="pomodoro.currentMode === mode"
        @click="requestMode(mode)"
      >
        {{ pomodoro.getModeLabel(mode) }}
      </button>
    </div>

    <!-- Anel de progresso -->
    <div class="dial" :class="{ running: pomodoro.isRunning }">
      <svg class="ring" viewBox="0 0 220 220" aria-hidden="true">
        <circle class="ring-base" cx="110" cy="110" r="106" />
        <circle class="ring-track" cx="110" cy="110" :r="RADIUS" />
        <circle
          class="ring-fill"
          cx="110"
          cy="110"
          :r="RADIUS"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
        />
        <circle class="ring-line" cx="110" cy="110" r="106" />
        <circle class="ring-line" cx="110" cy="110" r="86" />
      </svg>

      <div class="dial-face">
        <span class="dial-label">{{ pomodoro.isRunning ? 'restam' : 'pronto?' }}</span>
        <time class="dial-time" role="timer" aria-live="off">{{ pomodoro.formattedTime }}</time>
        <span class="dial-cycles" :title="`${pomodoro.completedFocusCount} ciclos de foco concluídos`">
          🍅 × {{ pomodoro.completedFocusCount }}
        </span>
      </div>
    </div>

    <!-- Controles -->
    <div class="controls">
      <button
        class="ctrl-round"
        title="Resetar"
        aria-label="Resetar"
        @click="pomodoro.reset()"
      >
        🔄
      </button>

      <button
        v-if="!pomodoro.isRunning"
        class="ctrl-main"
        @click="pomodoro.start()"
      >
        <span aria-hidden="true">▶</span> Iniciar
      </button>
      <button
        v-else
        class="ctrl-main paused"
        @click="pomodoro.pause()"
      >
        <span aria-hidden="true">❚❚</span> Pausar
      </button>

      <button
        class="ctrl-round"
        title="Pular para o próximo modo"
        aria-label="Pular"
        @click="requestSkip()"
      >
        ⏭️
      </button>
    </div>

    <!-- Mensagem de status em balão -->
    <p class="status" :class="{ done: pomodoro.lastCompletedMode }">
      <template v-if="pomodoro.isRunning">{{ runningMessage }}</template>
      <template v-else-if="pomodoro.lastCompletedMode">
        ✨ {{ pomodoro.getModeLabel(pomodoro.lastCompletedMode) }} concluído! Próximo: <strong>{{ pomodoro.getModeLabel() }}</strong>
      </template>
      <template v-else>Aperte <strong>Iniciar</strong> quando estiver pronto.</template>
    </p>

    <!-- Aviso ao trocar de modo com o timer rodando -->
    <ConfirmDialog
      :open="!!pending"
      :icon="isFocus ? '🍅' : '☕'"
      :tone="isFocus ? 'danger' : 'warning'"
      :title="isFocus ? 'Abandonar o foco?' : 'Encerrar a pausa?'"
      :cancel-label="`Continuar ${pomodoro.getModeLabel()}`"
      :confirm-label="`Ir para ${targetLabel}`"
      @cancel="pending = null"
      @confirm="confirmPending"
    >
      <p>
        O timer de <strong>{{ pomodoro.getModeLabel() }}</strong> está rodando
        há <strong>{{ elapsed }}</strong> (faltam {{ pomodoro.formattedTime }}).
      </p>
      <p v-if="isFocus">
        Se trocar para <strong>{{ targetLabel }}</strong> agora, este ciclo será perdido
        e você <strong>não ganhará as moedas</strong> nem a chama da ofensiva por ele.
      </p>
      <p v-else>
        Se trocar para <strong>{{ targetLabel }}</strong>, o restante da pausa será descartado.
      </p>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  pomodoro: { type: Object, required: true }
})

const RADIUS = 96
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const dashOffset = computed(() => CIRCUMFERENCE * (1 - props.pomodoro.progress))

const modeIcon = computed(() => ({
  focus: '🎯',
  shortBreak: '☕',
  longBreak: '🌙'
}[props.pomodoro.currentMode]))

// ---------- Confirmação de troca de modo ----------
// { kind: 'switch' | 'skip', mode } — ação aguardando confirmação
const pending = ref(null)

const isFocus = computed(() => props.pomodoro.currentMode === props.pomodoro.MODES.FOCUS)

// Mesmo destino que o skip() do composable usa
const skipTarget = () =>
  isFocus.value ? props.pomodoro.MODES.SHORT_BREAK : props.pomodoro.MODES.FOCUS

const targetLabel = computed(() =>
  pending.value ? props.pomodoro.getModeLabel(pending.value.mode) : ''
)

const elapsed = computed(() => {
  const secs = Math.max(0, props.pomodoro.totalDuration - props.pomodoro.timeRemaining)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`
})

const requestMode = (mode) => {
  if (mode === props.pomodoro.currentMode) return
  if (!props.pomodoro.isRunning) return props.pomodoro.setMode(mode)
  pending.value = { kind: 'switch', mode }
}

const requestSkip = () => {
  if (!props.pomodoro.isRunning) return props.pomodoro.skip()
  pending.value = { kind: 'skip', mode: skipTarget() }
}

const confirmPending = () => {
  const action = pending.value
  pending.value = null
  if (!action) return
  if (action.kind === 'skip') props.pomodoro.skip()
  else props.pomodoro.setMode(action.mode)
}

// Se o ciclo terminar (ou for pausado) com o popup aberto, o aviso perde o sentido
watch(() => props.pomodoro.isRunning, (running) => {
  if (!running) pending.value = null
})

const runningMessage = computed(() =>
  props.pomodoro.currentMode === props.pomodoro.MODES.FOCUS
    ? 'Modo foco ativado! Seu pet está torcendo por você.'
    : 'Hora de relaxar. Estique as pernas e beba água 💧'
)
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.timer {
  --mode: #{$tomato};
  --mode-deep: #{$tomato-deep};

  @include panel($spacing-xl $spacing-md $spacing-lg);
  @include stitched;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  margin-top: $spacing-md;
  background:
    radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--mode) 18%, transparent), transparent 60%),
    $surface;
  transition: background $transition-slow;

  @include md-up { padding: $spacing-2xl $spacing-xl $spacing-xl; }

  &.mode-shortBreak { --mode: #{$mint}; --mode-deep: #{$mint-deep}; }
  &.mode-longBreak { --mode: #{$sky}; --mode-deep: #{$sky-deep}; }
}

.ribbon { @include ribbon(var(--mode), var(--mode-deep)); }

// ---------- Modos ----------
.modes {
  @include well($radius-full);
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem;
  max-width: 100%;
  position: relative;
  z-index: 1;
}

.mode-btn {
  padding: 0.55rem 0.9rem;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-sm;
  color: $ink-soft;
  border: $border-width solid transparent;
  border-radius: $radius-full;
  white-space: nowrap;
  transition: background $transition-base, color $transition-base, transform $transition-fast;

  @include sm-up { padding: 0.55rem 1.2rem; font-size: $font-size-base; }

  &:hover:not(.active) { color: $ink; transform: translateY(-1px); }

  &.active {
    color: $ink-on-color;
    border-color: $outline;
    box-shadow: inset 0 -3px 0 var(--btn-deep), 0 2px 0 $outline;
    background: var(--btn);
  }

  &.is-focus { --btn: #{$tomato}; --btn-deep: #{$tomato-deep}; }
  &.is-shortBreak { --btn: #{$mint}; --btn-deep: #{$mint-deep}; }
  &.is-longBreak { --btn: #{$sky}; --btn-deep: #{$sky-deep}; }
}

// ---------- Mostrador ----------
.dial {
  position: relative;
  width: min(78vw, 290px);
  aspect-ratio: 1;
  z-index: 1;

  @include md-up { width: 320px; }
}

.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  overflow: visible;
  // degrau sólido embaixo (a rotação de -90° faz o eixo X virar "baixo")
  filter: drop-shadow(-5px 0 0 var(--pp-outline));
}

.ring-base { fill: $surface; }

.ring-track {
  fill: none;
  stroke: $surface-3;
  stroke-width: 18;
}

.ring-line {
  fill: none;
  stroke: $outline;
  stroke-width: 2.6;
}

.ring-fill {
  fill: none;
  stroke: var(--mode);
  stroke-width: 18;
  stroke-linecap: round;
  transition: stroke-dashoffset 400ms linear, stroke $transition-slow;
}

.dial-face {
  @include absolute-center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.dial-label {
  font-family: $font-display;
  font-weight: 500;
  font-size: $font-size-sm;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: $ink-faint;
}

.dial-time {
  font-family: $font-numbers;
  font-weight: 900;
  font-size: clamp(2.8rem, 13vw, 4rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: $ink;

  .dial.running & { animation: pp-pulse 2s ease-in-out infinite; }

  @include md-up { font-size: 4.4rem; }
}

.dial-cycles {
  @include chip($surface-2, $ink-soft);
  margin-top: 0.35rem;
  text-transform: none;
  font-size: $font-size-sm;
}

// ---------- Controles ----------
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  position: relative;
  z-index: 1;
}

.ctrl-main {
  @include chunky-btn(var(--mode), var(--mode-deep));
  min-width: 10rem;
  padding: 0.95rem 1.6rem;
  font-size: $font-size-xl;

  &.paused { @include chunky-btn($sun, $sun-deep); min-width: 10rem; padding: 0.95rem 1.6rem; font-size: $font-size-xl; }
}

.ctrl-round { @include chunky-icon-btn(3.4rem); }

// ---------- Status ----------
.status {
  position: relative;
  z-index: 1;
  max-width: 28rem;
  padding: 0.7rem 1.1rem;
  text-align: center;
  font-weight: 700;
  font-size: $font-size-sm;
  color: $ink-soft;
  @include well;

  strong { color: $ink; }

  &.done {
    color: $ink;
    background: color-mix(in srgb, #{$sun} 30%, transparent);
    animation: pp-pop-in 400ms $ease-bounce both;
  }
}
</style>
