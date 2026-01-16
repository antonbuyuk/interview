<template>
  <div class="secondary-menu">
    <!-- Если не авторизован -->
    <button v-if="!isAdmin" class="secondary-menu-item" title="Авторизация" @click="openLoginModal">
      <LockClosedIcon class="nav-icon" />
    </button>

    <template v-else>
      <button class="secondary-menu-item" title="Добавить вопрос" @click="openAddQuestion">
        <QuestionMarkCircleIcon class="nav-icon" />
      </button>
      <button class="secondary-menu-item" title="Настройка раздела" @click="openManageSections">
        <Cog6ToothIcon class="nav-icon" />
      </button>
      <button class="secondary-menu-item" title="Добавить термин" @click="openAddTerm">
        <BookOpenIcon class="nav-icon" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAdminAuth } from '../../composables/useAdminAuth';
import {
  LockClosedIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  BookOpenIcon,
} from '@heroicons/vue/24/outline';

const { isAdmin } = useAdminAuth();

const openAddQuestion = () => {
  const event = new CustomEvent('open-add-question');
  window.dispatchEvent(event);
};

const openManageSections = () => {
  const event = new CustomEvent('open-manage-sections');
  window.dispatchEvent(event);
};

const openAddTerm = () => {
  const event = new CustomEvent('open-add-term');
  window.dispatchEvent(event);
};

const openLoginModal = () => {
  const event = new CustomEvent('open-login-modal');
  window.dispatchEvent(event);
};
</script>

<style lang="scss" scoped>
@use '../../styles/mixins' as *;
@use '../../styles/variables' as *;
.secondary-menu {
  bottom: 1rem;
  right: 1rem;
  position: fixed;
  display: flex;
  z-index: 100;
  gap: 1rem;
  background-color: white;
  @include rounded-md;
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

    .nav-icon {
      width: 1.25rem;
      height: 1.25rem;
      color: inherit;
    }

    &:hover {
      background: #f0f0f0;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
