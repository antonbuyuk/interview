<template>
  <div class="secondary-menu">
    <!-- Если не авторизован -->
    <button v-if="!isAdmin" class="secondary-menu-item" @click="openLoginModal">
      <span class="nav-icon">🔐</span>
    </button>

    <template v-else>
      <button class="secondary-menu-item" @click="openAddQuestion">
        <span class="nav-icon">➕</span>
        <!-- <span>Добавить вопрос</span> -->
      </button>
      <button class="secondary-menu-item" @click="openManageSections">
        <span class="nav-icon">⚙️</span>
        <!-- <span>Настройка раздела</span> -->
      </button>
    </template>
  </div>
</template>

<script setup>
import { useAdminAuth } from '../composables/useAdminAuth';

const { isAdmin } = useAdminAuth();

const openAddQuestion = () => {
  const event = new CustomEvent('open-add-question');
  window.dispatchEvent(event);
};

const openManageSections = () => {
  const event = new CustomEvent('open-manage-sections');
  window.dispatchEvent(event);
};
</script>

<style lang="scss" scoped>
@use '../styles/mixins' as *;
@use '../styles/variables' as *;
.secondary-menu {
  bottom: 1rem;
  right: 1rem;
  position: fixed;
  display: flex;
  z-index: 100;
  gap: 1rem;
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

  &-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: #1e1e1e;
    font-size: 1.125rem;
    cursor: pointer;
    border-radius: 6px;
    @include transition;

    &:hover {
      background: #f0f0f0;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
