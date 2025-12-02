<template>
  <div class="home">
    <div class="home-header">
      <h1>📚 Шпаргалка: Вопросы для собеседования Frontend Developer</h1>
      <p class="description">
        Подборка вопросов и ответов для подготовки к собеседованиям на позицию Frontend Developer
      </p>
    </div>

    <div class="sections-grid">
      <router-link
        v-for="section in sections"
        :key="section.id"
        :to="section.path"
        class="section-card"
      >
        <div class="card-header">
          <h3>{{ section.title }}</h3>
        </div>
        <div class="card-footer">
          <span class="card-link">Перейти →</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { sections } from '../data/sections.js'
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.home-header {
  margin-bottom: 3rem;
  text-align: center;
}

.home-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1e1e1e;
}

.description {
  font-size: 1.125rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.section-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
}

.section-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: #42b883;
}

.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e1e1e;
  margin: 0;
}

.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.card-link {
  color: #42b883;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .home-header h1 {
    font-size: 2rem;
  }

  .sections-grid {
    grid-template-columns: 1fr;
  }
}
</style>

