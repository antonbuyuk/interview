<template>
  <div
    v-if="shouldShowMenu"
    class="text-selection-menu"
    :style="{
      left: `${menuPosition.x}px`,
      top: `${menuPosition.y}px`,
    }"
    @click.stop
  >
    <button class="menu-button" @click="handleAddToDictionary">
      <span class="menu-icon">📖</span>
      <span class="menu-text">Добавить в словарь</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTextSelection } from '../composables/useTextSelection';

const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add-to-dictionary']);

const { selectedText, showMenu, menuPosition, clearSelection } = useTextSelection();

const handleAddToDictionary = () => {
  if (selectedText.value) {
    emit('add-to-dictionary', selectedText.value);
    clearSelection();
  }
};

// Показываем меню только для админов
const shouldShowMenu = computed(() => props.isAdmin && showMenu.value && selectedText.value);
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.text-selection-menu {
  position: fixed;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: auto;
  margin-top: 8px;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid $border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  color: $text-dark;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: $primary-color;
    color: white;
    border-color: $primary-color;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(66, 184, 131, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.menu-icon {
  font-size: 1.125rem;
}

.menu-text {
  line-height: 1;
}
</style>
