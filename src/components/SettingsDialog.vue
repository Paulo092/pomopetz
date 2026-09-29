<template>
  <BaseDialog
    :open="open"
    title="Configurações"
    icon="⚙️"
    tone="grape"
    width="560px"
    @close="emit('close')"
  >
    <section class="section" aria-labelledby="sound-heading">
      <div class="section-head">
        <h3 id="sound-heading" class="section-title">🔔 Som ao terminar o timer</h3>

        <label class="switch">
          <input v-model="settings.soundEnabled" type="checkbox" class="switch-input" />
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="switch-text">{{ settings.soundEnabled ? 'Ligado' : 'Desligado' }}</span>
        </label>
      </div>

      <fieldset class="options" :class="{ muted: !settings.soundEnabled }">
        <legend class="sr-only">Escolha o som</legend>

        <div
          v-for="option in SOUND_OPTIONS"
          :key="option.id"
          class="option"
          :class="{ selected: settings.soundId === option.id }"
        >
          <label class="option-pick">
            <input
              v-model="settings.soundId"
              type="radio"
              name="timer-sound"
              :value="option.id"
              class="sr-only"
              @change="preview(option.id)"
            />
            <span class="option-icon" aria-hidden="true">{{ option.icon }}</span>
            <span class="option-name">{{ option.name }}</span>
            <span class="option-desc">{{ option.description }}</span>
          </label>

          <button
            class="option-play"
            :aria-label="`Ouvir o som ${option.name}`"
            @click="preview(option.id)"
          >
            ▶ Ouvir
          </button>
        </div>
      </fieldset>

      <div class="volume" :class="{ muted: !settings.soundEnabled }">
        <label for="volume-range" class="volume-label">Volume</label>
        <span class="volume-icon" aria-hidden="true">{{ volumeIcon }}</span>
        <input
          id="volume-range"
          v-model.number="volumePercent"
          type="range"
          min="0"
          max="100"
          step="5"
          class="volume-range"
          :style="{ '--fill': volumePercent + '%' }"
          :aria-valuetext="volumePercent === 0 ? 'Mudo' : `${volumePercent}%`"
          @change="preview()"
        />
        <span class="volume-value">{{ volumePercent === 0 ? 'Mudo' : volumePercent + '%' }}</span>
      </div>

      <p v-if="!settings.soundEnabled" class="note">
        O som está desligado: o timer vai terminar em silêncio. Você ainda pode ouvir as prévias.
      </p>
    </section>

    <template #actions>
      <button class="btn-done" @click="emit('close')">✓ Pronto</button>
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { useSound } from '../composables/useSound'

defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

// As preferências são salvas automaticamente no localStorage pelo useSound
const { settings, SOUND_OPTIONS, preview } = useSound()

const volumePercent = computed({
  get: () => Math.round(settings.volume * 100),
  set: (value) => { settings.volume = value / 100 }
})

const volumeIcon = computed(() => {
  if (volumePercent.value === 0) return '🔇'
  if (volumePercent.value < 50) return '🔉'
  return '🔊'
})
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  text-align: left;
}

.section-head {
  @include flex-between;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.section-title {
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-lg;
  color: $ink;
}

// ---------- Interruptor liga/desliga ----------
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-family: $font-display;
  font-weight: 600;
  color: $ink;
}

.switch-input {
  @include visually-hidden;
}

.switch-track {
  position: relative;
  width: 3.4rem;
  height: 1.9rem;
  background: $surface-3;
  border: $border-width solid $outline;
  border-radius: $radius-full;
  box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.08);
  transition: background $transition-base;

  .switch-input:checked + & { background: $mint; }
  .switch-input:focus-visible + & { outline: 3px solid $sun; outline-offset: 2px; }
}

.switch-thumb {
  position: absolute;
  top: 50%;
  left: 0.15rem;
  width: 1.35rem;
  height: 1.35rem;
  translate: 0 -50%;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: 50%;
  transition: left $transition-base $ease-bounce;

  .switch-input:checked + .switch-track & { left: calc(100% - 1.5rem); }
}

.switch-text { min-width: 5.2rem; }

// ---------- Opções de som ----------
.options {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-sm;
  border: none;
  transition: opacity $transition-base;

  @include sm-up { grid-template-columns: repeat(3, 1fr); }

  &.muted { opacity: 0.6; }
}

.option {
  --opt: #{$surface};
  --opt-deep: #{$surface-3};

  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 0.5rem;
  background: var(--opt);
  border: $border-width solid $outline;
  border-radius: $radius-lg;
  box-shadow: inset 0 -4px 0 var(--opt-deep), 0 $ledge-sm 0 $outline;
  transition: transform $transition-fast $ease-bounce, background $transition-base;

  @include sm-up {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  &:hover { transform: translateY(-2px); }

  &.selected {
    --opt: #{$grape};
    --opt-deep: #{$grape-deep};
    color: $ink-on-color;
  }

  &:focus-within:not(:has(.option-play:focus-visible)) {
    outline: 3px solid $sun;
    outline-offset: 3px;
  }
}

.option-pick {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'icon name'
    'icon desc';
  align-items: center;
  column-gap: 0.6rem;
  flex: 1;
  cursor: pointer;

  @include sm-up {
    grid-template-columns: 1fr;
    grid-template-areas: 'icon' 'name' 'desc';
    align-content: start;
    justify-items: center;
    row-gap: 0.2rem;
  }
}

.option-icon {
  grid-area: icon;
  font-size: 2rem;
  line-height: 1;

  .option.selected & { animation: pp-wiggle 600ms ease-in-out; }
}

.option-name {
  grid-area: name;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-lg;
  color: $ink;

  .option.selected & { color: $ink-on-color; }
}

.option-desc {
  grid-area: desc;
  font-size: $font-size-xs;
  line-height: 1.35;
  color: $ink-soft;

  .option.selected & { color: $ink-on-color; opacity: 0.85; }
}

.option-play {
  @include chunky-btn($surface, $surface-3, $ink);
  flex-shrink: 0;
  padding: 0.5em 0.9em;
  font-size: $font-size-sm;
}

// ---------- Volume ----------
.volume {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.9rem;
  @include well;
  transition: opacity $transition-base;

  &.muted { opacity: 0.6; }
}

.volume-label {
  font-family: $font-display;
  font-weight: 600;
  color: $ink;
}

.volume-icon { font-size: 1.2rem; width: 1.5rem; text-align: center; }

.volume-value {
  min-width: 3.2rem;
  text-align: right;
  font-family: $font-numbers;
  font-weight: 900;
  color: $ink;
}

.volume-range {
  flex: 1;
  min-width: 0;
  height: 1.8rem;
  padding: 0;
  background: transparent;
  border: none;
  appearance: none;
  cursor: pointer;

  &:focus-visible { outline: 3px solid $sun; outline-offset: 2px; border-radius: $radius-full; }

  &::-webkit-slider-runnable-track {
    height: 0.9rem;
    background: linear-gradient(90deg, $grape var(--fill), $surface 0);
    border: $border-width solid $outline;
    border-radius: $radius-full;
  }

  &::-moz-range-track {
    height: 0.9rem;
    background: linear-gradient(90deg, $grape var(--fill), $surface 0);
    border: $border-width solid $outline;
    border-radius: $radius-full;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 1.6rem;
    height: 1.6rem;
    margin-top: calc((0.9rem - 6px - 1.6rem) / 2);
    background: $sun;
    border: $border-width solid $outline;
    border-radius: 50%;
    box-shadow: inset 0 -3px 0 $sun-deep;
  }

  &::-moz-range-thumb {
    width: 1.6rem;
    height: 1.6rem;
    background: $sun;
    border: $border-width solid $outline;
    border-radius: 50%;
    box-shadow: inset 0 -3px 0 $sun-deep;
  }
}

.note {
  font-size: $font-size-xs;
  color: $ink-soft;
}

.btn-done {
  @include chunky-btn($grape, $grape-deep);
  flex: 0 1 12rem !important;
}
</style>
