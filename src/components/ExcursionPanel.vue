<template>
  <section class="expedition">
    <h2 class="ribbon">🗺️ Excursões</h2>

    <!-- Pets que voltaram -->
    <div v-if="readyExcursions.length" class="block">
      <h3 class="block-title">🎁 Voltaram de viagem!</h3>
      <ul class="trip-list">
        <li v-for="trip in readyExcursions" :key="trip.index" class="trip ready" :class="trip.region">
          <span class="trip-pet" aria-hidden="true">{{ getPet(trip.petId).emoji }}</span>
          <div class="trip-info">
            <p class="trip-name">{{ getPet(trip.petId).name }}</p>
            <p class="trip-place">{{ region(trip.region).emoji }} {{ region(trip.region).name }}</p>
          </div>
          <button class="claim" @click="claimReward(trip.index)">
            <span aria-hidden="true">🎁</span> Abrir
          </button>
        </li>
      </ul>
    </div>

    <!-- Pets viajando -->
    <div class="block">
      <h3 class="block-title">🧭 A caminho</h3>
      <p v-if="!activeExcursions.length" class="empty">Nenhum pet explorando agora. Escolha um destino abaixo!</p>
      <ul v-else class="trip-list">
        <li v-for="trip in activeExcursions" :key="trip.index" class="trip" :class="trip.region">
          <span class="trip-pet walking" aria-hidden="true">{{ getPet(trip.petId).emoji }}</span>
          <div class="trip-info">
            <p class="trip-name">{{ getPet(trip.petId).name }}</p>
            <p class="trip-place">{{ region(trip.region).emoji }} {{ region(trip.region).name }}</p>
            <div class="trip-bar" role="progressbar" :aria-valuenow="Math.round(tripProgress(trip) * 100)" aria-valuemin="0" aria-valuemax="100">
              <div class="trip-fill" :style="{ width: tripProgress(trip) * 100 + '%' }"></div>
            </div>
          </div>
          <span class="trip-time">⏳ {{ timeLeft(trip) }}</span>
        </li>
      </ul>
    </div>

    <!-- Destinos -->
    <div class="block">
      <h3 class="block-title">📍 Destinos</h3>
      <p v-if="!availablePets.length && !activeExcursions.length" class="empty">
        Você precisa de pelo menos um pet para explorar.
      </p>

      <div class="regions">
        <article v-for="key in regionKeys" :key="key" class="region" :class="key">
          <header class="region-banner">
            <span class="region-emoji" aria-hidden="true">{{ region(key).emoji }}</span>
            <h4 class="region-name">{{ region(key).name }}</h4>
          </header>

          <ul class="region-stats">
            <li title="Duração">⏱️ {{ formatDuration(region(key).duration) }}</li>
            <li title="Custo">🪙 {{ region(key).cost }}</li>
            <li title="Chance de pet raro">🎁 {{ Math.round(region(key).petDropChance * 100) }}%</li>
          </ul>

          <fieldset class="picker">
            <legend class="picker-legend">Quem vai?</legend>
            <p v-if="!availablePets.length" class="picker-empty">Todos os pets estão viajando</p>
            <div v-else class="picker-row">
              <button
                v-for="pet in availablePets"
                :key="pet.id"
                class="pick"
                :class="{ selected: selected[key] === pet.id }"
                :aria-pressed="selected[key] === pet.id"
                :title="pet.name"
                :aria-label="pet.name"
                @click="selected[key] = selected[key] === pet.id ? null : pet.id"
              >
                {{ pet.emoji }}
              </button>
            </div>
          </fieldset>

          <button class="send" :disabled="!canSend(key)" @click="sendExcursion(key)">
            <template v-if="rewards.coins < region(key).cost">🔒 Faltam {{ region(key).cost - rewards.coins }} 🪙</template>
            <template v-else>🚀 Enviar</template>
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  excursion: { type: Object, required: true },
  rewards: { type: Object, required: true },
  pets: { type: Array, default: () => [] }
})

const emit = defineEmits(['excursion-started', 'excursion-claimed'])

// Relógio reativo: Date.now() sozinho não dispara re-render
const now = ref(Date.now())
let clock = null
onMounted(() => { clock = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(clock))

const selected = reactive({})

const regionKeys = computed(() => Object.values(props.excursion.EXCURSION_REGIONS))
const region = (key) => props.excursion.EXCURSION_CONFIG[key]

const trips = computed(() =>
  props.excursion.activeExcursions
    .map((trip, index) => ({ ...trip, index }))
    .filter(trip => !trip.claimed)
)

const activeExcursions = computed(() =>
  trips.value
    .filter(trip => trip.returnTimestamp > now.value)
    .sort((a, b) => a.returnTimestamp - b.returnTimestamp)
)

const readyExcursions = computed(() =>
  trips.value.filter(trip => trip.returnTimestamp <= now.value)
)

const awayIds = computed(() => new Set(trips.value.map(t => t.petId)))

const availablePets = computed(() =>
  props.rewards.getUnlockedPets().filter(pet => !awayIds.value.has(pet.id))
)

const UNKNOWN_PET = { emoji: '❓', name: 'Desconhecido' }
const getPet = (petId) => props.pets.find(p => p.id === petId) || UNKNOWN_PET

const tripProgress = (trip) => {
  const duration = region(trip.region).duration
  const remaining = Math.max(0, trip.returnTimestamp - now.value)
  return Math.min(1, 1 - remaining / duration)
}

const timeLeft = (trip) => {
  const total = Math.max(0, Math.floor((trip.returnTimestamp - now.value) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

const formatDuration = (ms) => `${Math.round(ms / 3600000)}h`

const canSend = (key) => {
  const petId = selected[key]
  return !!petId &&
    !awayIds.value.has(petId) &&
    props.excursion.canStartExcursion(petId, key, props.rewards.coins)
}

const sendExcursion = (key) => {
  if (!canSend(key)) return
  const petId = selected[key]
  if (props.rewards.removeCoins(props.excursion.getExcursionCost(key))) {
    props.excursion.startExcursion(petId, key)
    selected[key] = null
    now.value = Date.now()
    emit('excursion-started', { petId, region: key })
  }
}

const claimReward = (index) => {
  const reward = props.excursion.completeExcursion(index)
  if (reward) emit('excursion-claimed', reward)
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.expedition {
  @include panel($spacing-2xl $spacing-md $spacing-lg);
  @include stitched;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;

  @include md-up { padding: $spacing-2xl $spacing-xl $spacing-xl; }
}

.ribbon { @include ribbon($mint, $mint-deep); }

.block {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.block-title {
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-xl;
}

.empty {
  padding: $spacing-md;
  text-align: center;
  font-size: $font-size-sm;
  color: $ink-soft;
  @include well;
}

// Cores por região
.forest { --reg: #7cc46b; --reg-deep: #4f9a45; }
.mountain { --reg: #{$grape}; --reg-deep: #{$grape-deep}; }
.ocean { --reg: #{$sky}; --reg-deep: #{$sky-deep}; }
.volcano { --reg: #{$tomato}; --reg-deep: #{$tomato-deep}; }

// ---------- Viagens ----------
.trip-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.trip {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: 0.6rem 0.9rem 0.6rem 0.6rem;
  background: $surface;
  border: $border-width solid $outline;
  border-left-width: 10px;
  border-left-color: var(--reg);
  border-radius: $radius-lg;
  box-shadow: 0 $ledge-sm 0 $outline;
  animation: pp-slide-up 300ms $ease-bounce both;

  &.ready {
    background: color-mix(in srgb, #{$sun} 22%, var(--pp-surface));
    border-left-color: $sun;
  }
}

.trip-pet {
  @include flex-center;
  flex-shrink: 0;
  width: 3.2rem;
  height: 3.2rem;
  font-size: 2rem;
  background: var(--reg);
  border: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: inset 0 -4px 0 var(--reg-deep);

  &.walking { animation: pp-walk 0.9s ease-in-out infinite; }
  .ready & { animation: pp-pulse 1.2s ease-in-out infinite; }
}

.trip-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.trip-name {
  font-family: $font-display;
  font-weight: 600;
  @include truncate;
}

.trip-place {
  font-size: $font-size-sm;
  color: $ink-soft;
}

.trip-bar {
  @include progress-track(0.8rem);
  margin-top: 0.25rem;
  border-width: 2px;
}

.trip-fill { @include progress-fill(var(--reg), var(--reg-deep)); }

.trip-time {
  flex-shrink: 0;
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-sm;
  font-variant-numeric: tabular-nums;
}

.claim {
  @include chunky-btn($sun, $sun-deep);
  flex-shrink: 0;
  animation: pp-pulse 1.4s ease-in-out infinite;
}

// ---------- Destinos ----------
.regions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: $spacing-lg;
}

.region {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.6rem 0.6rem 0.9rem;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-lg;
  box-shadow: 0 $ledge 0 $outline;
  transition: transform $transition-base $ease-bounce;

  &:hover { transform: translateY(-3px); }
}

.region-banner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 0.9rem;
  overflow: hidden;
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.45), transparent 45%),
    linear-gradient(160deg, var(--reg), var(--reg-deep));
  border: $border-width solid $outline;
  border-radius: $radius-md;

  &::after {
    // "chão" do mapa
    content: '';
    position: absolute;
    left: -10%;
    right: -10%;
    bottom: -60%;
    height: 90%;
    background: rgba(0, 0, 0, 0.12);
    border-radius: 50%;
  }
}

.region-emoji {
  position: relative;
  z-index: 1;
  font-size: 2.6rem;
  line-height: 1;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.2));
}

.region-name {
  position: relative;
  z-index: 1;
  font-family: $font-display;
  font-weight: 700;
  font-size: $font-size-xl;
  color: #fff;
  -webkit-text-stroke: 5px $ink-on-color;
  paint-order: stroke fill;
}

.region-stats {
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;

  li {
    flex: 1;
    padding: 0.35rem 0.25rem;
    text-align: center;
    font-family: $font-numbers;
    font-weight: 900;
    font-size: $font-size-sm;
    @include well($radius-sm);
  }
}

.picker {
  border: none;
  min-width: 0;
}

.picker-legend {
  margin-bottom: 0.35rem;
  font-size: $font-size-xs;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $ink-faint;
}

.picker-empty {
  font-size: $font-size-sm;
  color: $ink-faint;
}

.picker-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pick {
  @include flex-center;
  width: 2.6rem;
  height: 2.6rem;
  font-size: 1.5rem;
  background: $surface-2;
  border: $border-width solid $outline;
  border-radius: $radius-md;
  transition: transform $transition-fast $ease-bounce, background $transition-fast;

  &:hover { transform: translateY(-2px) rotate(-6deg); }

  &.selected {
    background: var(--reg);
    box-shadow: inset 0 -3px 0 var(--reg-deep), 0 0 0 3px var(--pp-surface), 0 0 0 6px var(--reg);
    transform: scale(1.08);
  }
}

.send {
  @include chunky-btn(var(--reg), var(--reg-deep));
  width: 100%;
  margin-top: auto;
}
</style>
