<template>
  <div class="shop">
    <h2>Loja de Pets</h2>
    <p class="shop-subtitle">Suas moedas: <strong>💰 {{ rewards.coins }}</strong></p>
    <div class="pets-grid">
      <div v-for="pet in rewards.SHOP_PETS" :key="pet.id" class="pet-card" :class="{ unlocked: rewards.hasPet(pet.id) }">
        <div class="pet-header">
          <span class="pet-emoji">{{ pet.emoji }}</span>
          <span class="rarity-badge" :class="pet.rarity">{{ rarityLabel(pet.rarity) }}</span>
        </div>
        <h3 class="pet-card-name">{{ pet.name }}</h3>
        <div class="pet-price">
          <span class="price-icon">💰</span>
          <span class="price-value">{{ pet.price }}</span>
        </div>
        <button v-if="!rewards.hasPet(pet.id)" class="buy-button" :disabled="!rewards.canBuy(pet.id)" @click="buyPet(pet.id)">
          {{ rewards.coins >= pet.price ? '🛒 Comprar' : '💸 Sem moedas' }}
        </button>
        <div v-else class="owned-badge">✅ Possuído</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rewards: { type: Object, required: true }
})

const emit = defineEmits(['pet-purchased'])

const rarityLabel = (rarity) => {
  const labels = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' }
  return labels[rarity]
}

const buyPet = (petId) => {
  if (props.rewards.buyPet(petId)) {
    emit('pet-purchased', petId)
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.shop {
  @include card;
}

.shop-subtitle {
  color: $text-secondary;
  margin-bottom: $spacing-xl;
}

.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: $spacing-lg;

  @include md-up {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.pet-card {
  @include flex-column;
  gap: $spacing-sm;
  background-color: $bg-primary;
  border: 2px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  text-align: center;
  transition: all $transition-base;

  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-md;
    transform: translateY(-4px);
  }

  &.unlocked {
    border-color: $success-color;
    background: linear-gradient(135deg, rgba($success-color, 0.05), rgba($success-color, 0.02));
  }
}

.pet-header {
  @include flex-between;
  margin-bottom: $spacing-sm;
}

.pet-emoji {
  font-size: $font-size-3xl;
}

.rarity-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.common { background-color: rgba($text-secondary, 0.2); color: $text-secondary; }
  &.rare { background-color: rgba($info-color, 0.2); color: $info-color; }
  &.epic { background-color: rgba($primary-color, 0.2); color: $primary-color; }
  &.legendary { background-color: rgba($warning-color, 0.2); color: $warning-color; }
}

.pet-card-name {
  margin: 0;
  font-size: $font-size-base;
  color: $text-primary;
}

.pet-price {
  @include flex-center;
  gap: $spacing-xs;
  padding: $spacing-md;
  background-color: $bg-tertiary;
  border-radius: $radius-md;
  font-weight: $font-weight-semibold;
}

.buy-button {
  @include btn-base;
  @include btn-primary;
  width: 100%;
  padding: $spacing-md;
  font-size: $font-size-sm;

  &:disabled {
    opacity: 0.5;
  }
}

.owned-badge {
  padding: $spacing-md;
  background-color: rgba($success-color, 0.1);
  color: $success-color;
  border-radius: $radius-md;
  font-weight: $font-weight-semibold;
  font-size: $font-size-sm;
}
</style>
