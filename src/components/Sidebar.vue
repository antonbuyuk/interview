<template>
  <div v-if="isOpen" class="sidebar-overlay" @click="closeSidebar" @touchstart="closeSidebar"></div>
  <aside class="sidebar" :class="{ open: isOpen }">
    <div class="sidebar-header">
      <h1 class="logo">📚 Frontend Interview</h1>
      <p class="subtitle">Вопросы для собеседования</p>
      <button class="close-sidebar" @click="closeSidebar" aria-label="Закрыть меню">×</button>
    </div>

    <nav class="nav">
      <router-link
        to="/"
        class="nav-item"
        :class="{ active: route.path === '/' }"
      >
        <span class="nav-icon">🏠</span>
        <span class="nav-text">Главная</span>
      </router-link>

      <div class="nav-section">
        <h3 class="nav-section-title">Разделы</h3>
        <SectionDropdown
          v-for="section in sections"
          :key="section.id"
          :section="section"
        />
      </div>
    </nav>

    <div class="sidebar-footer">
      <p class="footer-text">Vue 3 + Vite</p>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { sections } from '../data/sections.js'
import SectionDropdown from './SectionDropdown.vue'

const route = useRoute()
const isOpen = ref(false)

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const closeSidebar = () => {
  isOpen.value = false
  const event = new CustomEvent('sidebar-closed')
  window.dispatchEvent(event)
}

const handleToggleSidebar = (event) => {
  isOpen.value = event.detail.open
}

onMounted(() => {
  window.addEventListener('toggle-sidebar', handleToggleSidebar)
})

onUnmounted(() => {
  window.removeEventListener('toggle-sidebar', handleToggleSidebar)
})

watch(() => route.path, () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    closeSidebar()
  }
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background: #ffffff;
  color: #1e1e1e;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
}

.sidebar-header {
  padding: 1.5rem;
  padding-right: 3rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  flex-shrink: 0;
  position: relative;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #1e1e1e;
}

.subtitle {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.nav {
  padding: 1rem 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #1e1e1e;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #1e1e1e;
}

.nav-item.active {
  background: #f0f7ff;
  border-left-color: #42b883;
  color: #42b883;
  font-weight: 500;
}

.nav-icon {
  margin-right: 0.75rem;
  font-size: 1.125rem;
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

.nav-section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  padding: 0.5rem 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  flex-shrink: 0;
}

.footer-text {
  font-size: 0.75rem;
  color: #666;
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
}

.close-sidebar {
  display: none;
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #1e1e1e;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-sidebar:hover {
  background: #f5f5f5;
  color: #1e1e1e;
}

@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
    top: 56px;
  }

  .close-sidebar {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 101;
    top: 56px;
    height: calc(100vh - 56px);
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

.sidebar::-webkit-scrollbar,
.nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.nav::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.sidebar::-webkit-scrollbar-thumb,
.nav::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover,
.nav::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
