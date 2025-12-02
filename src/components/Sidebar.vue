<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="logo">📚 Frontend Interview</h1>
      <p class="subtitle">Вопросы для собеседования</p>
    </div>

    <nav class="nav">
      <router-link
        to="/"
        class="nav-item"
        :class="{ active: $route.path === '/' }"
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
import { sections } from '../data/sections.js'
import SectionDropdown from './SectionDropdown.vue'
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background: #1e1e1e;
  color: #e0e0e0;
  overflow-y: auto;
  overflow-x: visible;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #333;
  background: #252525;
  flex-shrink: 0;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #fff;
}

.subtitle {
  font-size: 0.875rem;
  color: #999;
  margin: 0;
}

.nav {
  padding: 1rem 0;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #e0e0e0;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #2a2a2a;
  color: #fff;
}

.nav-item.active {
  background: #2a2a2a;
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
  border-top: 1px solid #333;
  background: #252525;
  flex-shrink: 0;
}

.footer-text {
  font-size: 0.75rem;
  color: #666;
  margin: 0;
  text-align: center;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

/* Scrollbar стилизация */
.sidebar::-webkit-scrollbar,
.nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.nav::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.sidebar::-webkit-scrollbar-thumb,
.nav::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover,
.nav::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
