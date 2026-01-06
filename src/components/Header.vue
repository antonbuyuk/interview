<template>
  <header v-if="isMobile" class="app-header">
    <button class="menu-toggle-btn" aria-label="Открыть меню" @click="toggleSidebar">
      <span class="menu-icon">☰</span>
    </button>
    <h1 class="header-title">📚 Frontend Interview</h1>
    <button
      class="filter-toggle-btn"
      aria-label="Открыть фильтр вопросов"
      :class="{ active: filterOpen }"
      @click="toggleFilter"
    >
      <span class="filter-icon">📋</span>
      <span v-if="questionsCount > 0" class="filter-count">{{ questionsCount }}</span>
    </button>
    <button
      v-if="!isAdmin"
      class="auth-btn"
      aria-label="Авторизоваться"
      @click="openLoginModal"
      title="Авторизоваться"
    >
      🔐
    </button>
  </header>

  <!-- Кнопка авторизации для десктопа -->
  <div v-if="!isMobile && !isAdmin" class="desktop-auth-btn-container">
    <button class="desktop-auth-btn" @click="openLoginModal" title="Авторизоваться">
      🔐 Авторизоваться
    </button>
  </div>

  <!-- Модальное окно авторизации -->
  <AdminLoginModal :is-open="showLoginModal" @close="closeLoginModal" @success="closeLoginModal" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAdminAuth } from '../composables/useAdminAuth';
import AdminLoginModal from './AdminLoginModal.vue';

const isMobile = ref(false);
const sidebarOpen = ref(false);
const filterOpen = ref(false);
const questionsCount = ref(0);
const showLoginModal = ref(false);

const { isAdmin } = useAdminAuth();

const openLoginModal = () => {
  showLoginModal.value = true;
};

const closeLoginModal = () => {
  showLoginModal.value = false;
};

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
  // Эмитим событие для открытия/закрытия sidebar
  const event = new CustomEvent('toggle-sidebar', { detail: { open: sidebarOpen.value } });
  window.dispatchEvent(event);
};

const toggleFilter = () => {
  filterOpen.value = !filterOpen.value;
  // Эмитим событие для открытия/закрытия фильтра вопросов
  const event = new CustomEvent('toggle-filter', { detail: { open: filterOpen.value } });
  window.dispatchEvent(event);
};

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Слушаем события от Sidebar для синхронизации состояния
    window.addEventListener('sidebar-closed', () => {
      sidebarOpen.value = false;
    });

    // Слушаем события закрытия фильтра
    window.addEventListener('filter-closed', () => {
      filterOpen.value = false;
    });

    // Слушаем обновления количества вопросов
    window.addEventListener('questions-count-updated', event => {
      questionsCount.value = event.detail.count;
    });

    // Слушаем изменения статуса авторизации
    window.addEventListener('admin-auth-changed', () => {
      // Composable автоматически обновит состояние
    });
  });

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.app-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: $bg-white;
  color: $text-dark;
  z-index: 102;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  align-items: center;
  padding: 0 1rem;
  gap: 1rem;
  border-bottom: 1px solid $border-color;

  @include mobile {
    display: flex;
  }
}

.menu-toggle-btn {
  background: transparent;
  border: none;
  color: $text-dark;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  @include transition;
  @include flex-center;
  width: 40px;
  height: 40px;

  &:hover {
    background: $bg-light;
    color: $text-dark;
  }

  &:active {
    transform: scale(0.95);
  }
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: $text-dark;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-toggle-btn {
  background: transparent;
  border: none;
  color: $text-dark;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  @include transition;
  @include flex-center;
  width: 40px;
  height: 40px;
  position: relative;

  &:hover {
    background: $bg-light;
    color: $text-dark;
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: $primary-color;
    color: white;
  }
}

.filter-icon {
  font-size: 1.125rem;
}

.filter-count {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #e74c3c;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.25rem;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.auth-btn {
  background: transparent;
  border: none;
  color: $text-dark;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  @include transition;
  @include flex-center;
  width: 40px;
  height: 40px;

  &:hover {
    background: $bg-light;
    color: $primary-color;
  }

  &:active {
    transform: scale(0.95);
  }
}

.desktop-auth-btn-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
  @include mobile {
    display: none;
  }
}

.desktop-auth-btn {
  padding: 0.5rem 1rem;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  @include transition;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #35a372;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
