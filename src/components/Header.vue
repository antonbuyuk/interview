<template>
  <header class="app-header" v-if="isMobile">
    <button @click="toggleSidebar" class="menu-toggle-btn" aria-label="Открыть меню">
      <span class="menu-icon">☰</span>
    </button>
    <h1 class="header-title">📚 Frontend Interview</h1>
    <button
      @click="toggleFilter"
      class="filter-toggle-btn"
      aria-label="Открыть фильтр вопросов"
      :class="{ active: filterOpen }"
    >
      <span class="filter-icon">📋</span>
      <span v-if="questionsCount > 0" class="filter-count">{{ questionsCount }}</span>
    </button>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(false)
const sidebarOpen = ref(false)
const filterOpen = ref(false)
const questionsCount = ref(0)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  // Эмитим событие для открытия/закрытия sidebar
  const event = new CustomEvent('toggle-sidebar', { detail: { open: sidebarOpen.value } })
  window.dispatchEvent(event)
}

const toggleFilter = () => {
  filterOpen.value = !filterOpen.value
  // Эмитим событие для открытия/закрытия фильтра вопросов
  const event = new CustomEvent('toggle-filter', { detail: { open: filterOpen.value } })
  window.dispatchEvent(event)
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Слушаем события от Sidebar для синхронизации состояния
  window.addEventListener('sidebar-closed', () => {
    sidebarOpen.value = false
  })

  // Слушаем события закрытия фильтра
  window.addEventListener('filter-closed', () => {
    filterOpen.value = false
  })

  // Слушаем обновления количества вопросов
  window.addEventListener('questions-count-updated', (event) => {
    questionsCount.value = event.detail.count
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  color: #1e1e1e;
  z-index: 102;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  align-items: center;
  padding: 0 1rem;
  gap: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.menu-toggle-btn {
  background: transparent;
  border: none;
  color: #1e1e1e;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.menu-toggle-btn:hover {
  background: #f5f5f5;
  color: #1e1e1e;
}

.menu-toggle-btn:active {
  transform: scale(0.95);
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: #1e1e1e;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-toggle-btn {
  background: transparent;
  border: none;
  color: #1e1e1e;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  position: relative;
}

.filter-toggle-btn:hover {
  background: #f5f5f5;
  color: #1e1e1e;
}

.filter-toggle-btn:active {
  transform: scale(0.95);
}

.filter-toggle-btn.active {
  background: #42b883;
  color: #fff;
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

@media (max-width: 768px) {
  .app-header {
    display: flex;
  }
}
</style>

