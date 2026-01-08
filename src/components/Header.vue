<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo-link">
        <h1 class="header-title">
          <RectangleStackIcon class="logo-icon" />
        </h1>
      </router-link>

      <!-- Навигация для десктопа -->
      <nav v-if="!isMobile" class="desktop-nav">
        <!-- Дропдаун "Разделы" -->
        <div class="nav-dropdown">
          <button class="nav-dropdown-btn" :class="{ active: isSectionsActive }">
            <span>Разделы</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="sections.length > 0" class="dropdown-menu sections-dropdown">
            <div class="dropdown-list">
              <router-link
                v-for="section in sections"
                :key="section.id"
                :to="section.path"
                class="dropdown-item"
                :class="{ active: isSectionActive(section.path) }"
              >
                <span class="section-title">{{ section.title }}</span>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Дропдаун "Тренировка" -->
        <div class="nav-dropdown">
          <button class="nav-dropdown-btn" :class="{ active: isTrainingActive }">
            <span>Тренировка</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-menu training-dropdown">
            <div class="dropdown-list">
              <router-link
                to="/training/flash-cards"
                class="dropdown-item"
                :class="{ active: route.path === '/training/flash-cards' }"
              >
                <RectangleStackIcon class="nav-icon" />
                <span>Флэш-карточки</span>
              </router-link>
              <router-link
                to="/training/practice"
                class="dropdown-item"
                :class="{ active: route.path === '/training/practice' }"
                @click="hideTrainingDropdown"
              >
                <ClockIcon class="nav-icon" />
                <span>Режим самопроверки</span>
              </router-link>
              <router-link
                to="/vocabulary"
                class="dropdown-item"
                :class="{ active: route.path === '/vocabulary' }"
                @click="hideTrainingDropdown"
              >
                <BookOpenIcon class="nav-icon" />
                <span>Словарь терминов</span>
              </router-link>
            </div>
          </div>
        </div>
      </nav>

      <!-- Мобильное меню -->
      <button
        v-if="isMobile"
        class="menu-toggle-btn"
        aria-label="Открыть меню"
        @click="toggleMobileMenu"
      >
        <Bars3Icon class="menu-icon" />
      </button>
    </div>

    <div class="header-right">
      <!-- Поиск -->
      <div class="search-wrapper">
        <Search :current-section="currentSection" :questions="currentQuestions" />
      </div>

      <!-- English Only Toggle -->
      <button
        class="header-icon-btn"
        :class="{ active: englishOnly }"
        aria-label="English Only"
        :title="englishOnly ? 'Показать русский текст' : 'Только английский'"
        @click="toggleEnglishOnly"
      >
        en
      </button>

      <!-- Фильтр вопросов (только на странице раздела) -->
      <button
        v-if="showQuestionFilter"
        class="header-icon-btn"
        :class="{ active: filterOpen }"
        aria-label="Фильтр вопросов"
        title="Навигация по вопросам"
        @click="toggleFilter"
      >
        <ClipboardDocumentListIcon class="icon-btn" />
        <span v-if="questionsCount > 0" class="filter-count">{{ questionsCount }}</span>
      </button>
    </div>

    <!-- Мобильное меню -->
    <transition name="mobile-menu">
      <div v-if="isMobile && mobileMenuOpen" class="mobile-menu-overlay" @click="closeMobileMenu">
        <div class="mobile-menu" @click.stop>
          <div class="mobile-menu-header">
            <h3>Меню</h3>
            <button class="close-btn" @click="closeMobileMenu">
              <XMarkIcon class="icon-small" />
            </button>
          </div>
          <nav class="mobile-nav">
            <router-link to="/" class="mobile-nav-item" @click="closeMobileMenu">
              <HomeIcon class="nav-icon" />
              <span>Главная</span>
            </router-link>
            <div class="mobile-nav-section">
              <h4 class="mobile-nav-section-title">Тренировка</h4>
              <router-link
                to="/training/flash-cards"
                class="mobile-nav-item"
                @click="closeMobileMenu"
              >
                <RectangleStackIcon class="nav-icon" />
                <span>Флэш-карточки</span>
              </router-link>
              <router-link to="/training/practice" class="mobile-nav-item" @click="closeMobileMenu">
                <ClockIcon class="nav-icon" />
                <span>Режим самопроверки</span>
              </router-link>
              <router-link to="/vocabulary" class="mobile-nav-item" @click="closeMobileMenu">
                <BookOpenIcon class="nav-icon" />
                <span>Словарь терминов</span>
              </router-link>
            </div>
            <div class="mobile-nav-section">
              <div class="mobile-nav-section-header">
                <h4 class="mobile-nav-section-title">Разделы</h4>
                <button
                  v-if="isAdmin"
                  class="manage-sections-btn"
                  title="Управление разделами"
                  @click="openManageSections"
                >
                  <Cog6ToothIcon class="icon-small" />
                </button>
              </div>
              <router-link
                v-for="section in sections"
                :key="section.id"
                :to="section.path"
                class="mobile-nav-item"
                @click="closeMobileMenu"
              >
                <span>{{ section.title }}</span>
              </router-link>
            </div>
          </nav>
        </div>
      </div>
    </transition>

    <!-- Модальное окно авторизации -->
    <AdminLoginModal
      :is-open="showLoginModal"
      is-small
      @close="closeLoginModal"
      @success="closeLoginModal"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminAuth } from '../composables/useAdminAuth';
import { useTrainingMode } from '../composables/useTrainingMode';
import { getSections } from '../api/sections';
import AdminLoginModal from './AdminLoginModal.vue';
import Search from './Search.vue';
import {
  HomeIcon,
  RectangleStackIcon,
  ClockIcon,
  BookOpenIcon,
  Bars3Icon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();
const isMobile = ref(false);
const showUserMenu = ref(false);
const filterOpen = ref(false);
const mobileMenuOpen = ref(false);
const questionsCount = ref(0);
const showLoginModal = ref(false);
const sections = ref([]);
const currentSection = ref(null);
const currentQuestions = ref([]);

const { isAdmin } = useAdminAuth();
const { englishOnly } = useTrainingMode();

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const hideUserMenu = () => {
  setTimeout(() => {
    showUserMenu.value = false;
  }, 200);
};

const handleUserMenuClickOutside = event => {
  if (!event.target.closest('.user-menu-dropdown')) {
    showUserMenu.value = false;
  }
};

const toggleEnglishOnly = () => {
  englishOnly.value = !englishOnly.value;
};

const toggleFilter = () => {
  filterOpen.value = !filterOpen.value;
  const event = new CustomEvent('toggle-filter', { detail: { open: filterOpen.value } });
  window.dispatchEvent(event);
};

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const closeLoginModal = () => {
  showLoginModal.value = false;
};

const openManageSections = () => {
  const event = new CustomEvent('open-manage-sections');
  window.dispatchEvent(event);
  closeMobileMenu();
  hideUserMenu();
};

const loadSections = async () => {
  try {
    sections.value = await getSections();
  } catch (error) {
    console.error('Ошибка загрузки разделов:', error);
  }
};

const isSectionActive = path => {
  return route.path === path || route.path.startsWith(path + '#');
};

const isSectionsActive = computed(() => {
  return sections.value.some(section => isSectionActive(section.path));
});

const isTrainingActive = computed(() => {
  return (
    route.path === '/training/flash-cards' ||
    route.path === '/training/practice' ||
    route.path === '/vocabulary'
  );
});

const showQuestionFilter = computed(() => {
  // Показываем фильтр только на страницах разделов
  return sections.value.some(section => route.path.startsWith(section.path));
});

// Определяем текущий раздел при изменении маршрута
watch(
  () => route.path,
  () => {
    const section = sections.value.find(s => route.path.startsWith(s.path));
    if (section) {
      currentSection.value = section;
    }
    // Закрываем мобильное меню и пользовательское меню при смене маршрута
    closeMobileMenu();
    hideUserMenu();
  }
);

const handleOpenLoginModal = () => {
  showLoginModal.value = true;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  loadSections();

  // Слушаем события обновления разделов
  window.addEventListener('sections-updated', loadSections);

  // Слушаем события закрытия фильтра
  window.addEventListener('filter-closed', () => {
    filterOpen.value = false;
  });

  // Слушаем обновления количества вопросов
  window.addEventListener('questions-count-updated', event => {
    questionsCount.value = event.detail.count;
  });

  // Слушаем события для установки текущих вопросов
  window.addEventListener('current-questions-updated', event => {
    currentQuestions.value = event.detail.questions || [];
  });

  // Слушаем события для установки текущего раздела
  window.addEventListener('current-section-updated', event => {
    currentSection.value = event.detail.section || null;
  });

  // Слушаем события открытия модального окна авторизации
  window.addEventListener('open-login-modal', handleOpenLoginModal);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('sections-updated', loadSections);
  window.removeEventListener('open-login-modal', handleOpenLoginModal);
  document.removeEventListener('click', handleUserMenuClickOutside);
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: $bg-white;
  color: $text-dark;
  z-index: 102;
  @include shadow-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  gap: 1.5rem;
  border-bottom: 1px solid $border-color;

  @include mobile {
    height: 56px;
    padding: 0 1rem;
    gap: 1rem;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;

  @include mobile {
    gap: 1rem;
  }
}

.logo-link {
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: $text-dark;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .logo-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: $primary-color;
    flex-shrink: 0;
  }

  @include mobile {
    font-size: 1.125rem;

    .logo-icon {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @include mobile {
    display: none;
  }
}

.nav-dropdown {
  position: relative;
  cursor: pointer;

  // Невидимая область для плавного перехода курсора
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 0.75rem;
    background: transparent;
    pointer-events: auto;
  }

  &:hover {
    .dropdown-menu {
      display: block;
    }
  }
}

.nav-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: $text-dark;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  cursor: pointer;
  @include transition;

  &:hover {
    background: $bg-light;
  }

  &.active {
    color: $primary-color;
  }

  .dropdown-arrow {
    font-size: 0.75rem;
    transition: transform 0.2s;
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100%);
  left: 0;
  min-width: 240px;
  max-width: 320px;
  max-height: 500px;
  background: $bg-white;
  border: 1px solid $border-color;
  @include rounded-md;
  @include shadow-lg;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  display: none;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;
}

.dropdown-title {
  font-weight: 600;
  color: $text-dark;
  font-size: 0.875rem;
}

.manage-sections-btn {
  background: transparent;
  border: none;
  color: $text-lighter-gray;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  @include transition;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-small {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }

  &:hover {
    background: $bg-white;
    color: $primary-color;
  }
}

.dropdown-list {
  overflow-y: auto;
  max-height: 450px;
  @include custom-scrollbar;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: $text-dark;
  @include transition;
  border-bottom: 1px solid $border-color;
  background: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: inherit;

  &:hover {
    background: $bg-light;
    color: $primary-color;
  }

  &.active {
    background: #f0f7ff;
    color: $primary-color;
    font-weight: 500;
  }

  &:last-child {
    border-bottom: none;
  }

  .nav-icon {
    width: 1rem;
    height: 1rem;
    color: inherit;
  }
}

.section-title {
  font-size: 0.875rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.header-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: $text-dark;
  font-size: 1.125rem;
  cursor: pointer;
  border-radius: 6px;
  @include transition;

  .icon-btn {
    width: 1.25rem;
    height: 1.25rem;
    color: inherit;
  }

  &:hover {
    background: $bg-light;
    color: $primary-color;
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: $primary-color;
    color: white;
  }

  @include mobile {
    width: 36px;
    height: 36px;
    font-size: 1rem;

    .icon-btn {
      width: 1.125rem;
      height: 1.125rem;
    }
  }
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
  @include rounded-md;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.search-wrapper {
  position: relative;
  min-width: 250px;
  max-width: 400px;
  flex: 1;

  @include mobile {
    min-width: 150px;
    max-width: 200px;
  }
}

.user-menu-dropdown {
  position: relative;
}

.user-menu-btn {
  position: relative;
  // Стили уже определены в .header-icon-btn
}

.user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  left: auto;
  min-width: 200px;
  z-index: 1001;
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

  .menu-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: inherit;
  }

  &:hover {
    background: $bg-light;
  }

  &:active {
    transform: scale(0.95);
  }
}

.mobile-menu-overlay {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.mobile-menu {
  position: fixed;
  top: 56px;
  left: 0;
  width: 280px;
  height: calc(100vh - 56px);
  background: $bg-white;
  @include shadow-md;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  @include custom-scrollbar;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: $text-dark;
  }
}

.close-btn {
  background: transparent;
  border: none;
  color: $text-lighter-gray;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  @include transition;

  .icon-small {
    width: 1.25rem;
    height: 1.25rem;
    color: inherit;
  }

  &:hover {
    background: $bg-white;
    color: $text-gray;
  }
}

.mobile-nav {
  padding: 1rem 0;
  flex: 1;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: $text-dark;
  text-decoration: none;
  @include transition;
  border-left: 3px solid transparent;

  &:hover {
    background: $bg-light;
  }

  &.router-link-active {
    background: #f0f7ff;
    border-left-color: $primary-color;
    color: $primary-color;
    font-weight: 500;
  }

  .nav-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: inherit;
  }
}

.mobile-nav-section {
  margin-top: 1.5rem;
}

.mobile-nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  margin-bottom: 0.5rem;
}

.mobile-nav-section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-lighter-gray;
  font-weight: 600;
  margin: 0;
}

// Transitions
.dropdown-enter-active,
.dropdown-leave-active {
  @include transition(all, 0.2s, ease);
  opacity: 1;
  transform: translateY(0);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
