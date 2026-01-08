<template>
  <div v-if="isOpen" class="sidebar-overlay" @click="closeSidebar" @touchstart="closeSidebar"></div>
  <aside class="sidebar" :class="{ open: isOpen }">
    <nav class="nav">
      <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
        <HomeIcon class="nav-icon" />
        <span class="nav-text">Главная</span>
      </router-link>

      <div class="nav-section">
        <div class="nav-section-header">
          <h3 class="nav-section-title">Тренировка</h3>
        </div>
        <router-link
          to="/training/flash-cards"
          class="nav-item"
          :class="{ active: route.path === '/training/flash-cards' }"
        >
          <RectangleStackIcon class="nav-icon" />
          <span class="nav-text">Флэш-карточки</span>
        </router-link>
        <router-link
          to="/training/practice"
          class="nav-item"
          :class="{ active: route.path === '/training/practice' }"
        >
          <ClockIcon class="nav-icon" />
          <span class="nav-text">Режим самопроверки</span>
        </router-link>
        <router-link
          to="/vocabulary"
          class="nav-item"
          :class="{ active: route.path === '/vocabulary' }"
        >
          <BookOpenIcon class="nav-icon" />
          <span class="nav-text">Словарь терминов</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-section-header">
          <h3 class="nav-section-title">Разделы</h3>
          <button
            v-if="isAdmin"
            class="manage-sections-icon-btn"
            title="Управление разделами"
            @click.stop="openManageSections"
          >
            <Cog6ToothIcon class="icon-small" />
          </button>
        </div>
        <SectionDropdown v-for="section in sections" :key="section.id" :section="section" />
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSections } from '../api/sections';
import SectionDropdown from './SectionDropdown.vue';
import { useAdminAuth } from '../composables/useAdminAuth';
import {
  HomeIcon,
  RectangleStackIcon,
  ClockIcon,
  BookOpenIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();
const isOpen = ref(false);
const sections = ref([]);
const { isAdmin } = useAdminAuth();

const closeSidebar = () => {
  isOpen.value = false;
  const event = new CustomEvent('sidebar-closed');
  window.dispatchEvent(event);
};

const handleToggleSidebar = event => {
  isOpen.value = event.detail.open;
};

const loadSections = async () => {
  try {
    sections.value = await getSections();
  } catch (error) {
    console.error('Ошибка загрузки разделов:', error);
  }
};

const openManageSections = () => {
  // Эмитим событие для открытия модального окна управления разделами
  const event = new CustomEvent('open-manage-sections');
  window.dispatchEvent(event);
};

onMounted(() => {
  window.addEventListener('toggle-sidebar', handleToggleSidebar);
  loadSections();

  // Обновляем разделы при изменении
  window.addEventListener('sections-updated', loadSections);
});

onUnmounted(() => {
  window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  window.removeEventListener('sections-updated', loadSections);
});

watch(
  () => route.path,
  () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      closeSidebar();
    }
  }
);
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background: $bg-white;
  color: $text-dark;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid $border-color;
  @include custom-scrollbar;

  @include mobile {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 101;
    top: 56px;
    height: calc(100vh - 56px);

    &.open {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  padding: 1.5rem;
  padding-right: 3rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;
  flex-shrink: 0;
  position: relative;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: $text-dark;
}

.subtitle {
  font-size: 0.875rem;
  color: $text-lighter-gray;
  margin: 0;
}

.nav {
  padding: 1rem 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  @include custom-scrollbar;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: $text-dark;
  text-decoration: none;
  @include transition;
  border-left: 3px solid transparent;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;

  &:hover {
    background: $bg-light;
    color: $text-dark;
  }

  &.active {
    background: #f0f7ff;
    border-left-color: $primary-color;
    color: $primary-color;
    font-weight: 500;
  }
}

.nav-icon {
  margin-right: 0.75rem;
  width: 1.125rem;
  height: 1.125rem;
  color: inherit;
  flex-shrink: 0;
}

.nav-text {
  font-size: 0.9375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-section {
  margin-top: 1.5rem;
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  margin-bottom: 0.5rem;
}

.nav-section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-lighter-gray;
  font-weight: 600;
  margin: 0;
}

.manage-sections-icon-btn {
  background: transparent;
  border: none;
  color: $text-lighter-gray;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-small {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }

  &:hover {
    opacity: 1;
    background: $bg-light;
    color: $primary-color;
  }
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid $border-color;
  background: $bg-light;
  flex-shrink: 0;
}

.footer-text {
  font-size: 0.75rem;
  color: $text-lighter-gray;
  margin: 0;
  text-align: center;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;

  @include mobile {
    display: block;
    top: 56px;
  }
}

.close-sidebar {
  display: none;
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: $text-dark;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  @include transition;

  &:hover {
    background: $bg-light;
    color: $text-dark;
  }

  @include mobile {
    @include flex-center;
  }
}
</style>
