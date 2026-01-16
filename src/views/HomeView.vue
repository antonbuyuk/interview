<template>
  <div class="home">
    <div class="home-header">
      <h1>Шпаргалка: Вопросы для собеседования Frontend Developer</h1>
      <p class="description">
        Подборка вопросов и ответов для подготовки к собеседованиям на позицию Frontend Developer
      </p>
      <button class="manage-sections-btn" @click="openManageSections">
        <PlusIcon class="icon-inline" />
        Управление разделами
      </button>
    </div>

    <div class="sections-grid">
      <template v-if="loading">
        <Skeleton v-for="n in 4" :key="`skeleton-${n}`" variant="section-card" />
      </template>
      <template v-else>
        <router-link
          v-for="section in sections"
          :key="section.id"
          :to="section.path"
          class="section-card"
        >
          <div class="card-header">
            <h3>{{ section.title }}</h3>
            <span v-if="section._count" class="question-count-badge">
              {{ section._count.questions || 0 }} вопросов
            </span>
          </div>
          <div class="card-footer">
            <span class="card-link">Перейти →</span>
          </div>
        </router-link>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSectionsStore } from '../stores/sections';
import { PlusIcon } from '@heroicons/vue/24/outline';
import Skeleton from '../components/ui/Skeleton.vue';
import { storeToRefs } from 'pinia';

const sectionsStore = useSectionsStore();
const { sections, loading } = storeToRefs(sectionsStore);

const openManageSections = () => {
  // Эмитим событие для открытия модального окна управления разделами
  window.dispatchEvent(new CustomEvent('open-manage-sections'));
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;

  .title-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: #42b883;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    font-size: 2rem;

    .title-icon {
      width: 2rem;
      height: 2rem;
    }
  }
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
  @include rounded-md;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  @include transition(all, 0.3s, ease);
  @include shadow-sm;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
}

.section-card:hover {
  transform: translateY(-4px);
  @include shadow-xl;
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

.manage-sections-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  @include transition(all, 0.2s, ease);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: auto;

  .icon-inline {
    width: 1.125rem;
    height: 1.125rem;
    color: inherit;
  }

  &:hover {
    background: #35a372;
    transform: translateY(-1px);
    @include shadow-hover;
  }

  &:active {
    transform: translateY(0);
  }
}

.question-count-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #f0f7ff;
  color: #42b883;
  border-radius: 12px;
  font-size: 0.75rem;
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
