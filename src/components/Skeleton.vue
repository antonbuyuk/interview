<template>
  <div
    class="skeleton"
    :class="[`skeleton--${variant}`, { 'skeleton--rounded': rounded }]"
    :style="skeletonStyle"
  >
    <!-- Section Card Variant -->
    <template v-if="variant === 'section-card'">
      <div class="skeleton__section-card">
        <div class="skeleton__header">
          <div class="skeleton__line skeleton__line--title"></div>
          <div class="skeleton__badge"></div>
        </div>
        <div class="skeleton__footer">
          <div class="skeleton__line skeleton__line--link"></div>
        </div>
      </div>
    </template>

    <!-- Question Variant -->
    <template v-else-if="variant === 'question'">
      <div class="skeleton__question">
        <div class="skeleton__question-header">
          <div class="skeleton__line skeleton__line--question-title"></div>
          <div class="skeleton__button"></div>
        </div>
        <div class="skeleton__question-content">
          <div class="skeleton__line skeleton__line--text" style="width: 100%"></div>
          <div class="skeleton__line skeleton__line--text" style="width: 85%"></div>
          <div class="skeleton__line skeleton__line--title" style="width: 50%"></div>
          <div class="skeleton__answer is-type--en">
            <div class="skeleton__line skeleton__line--answer-title"></div>
          </div>
          <div class="skeleton__answer is-type--senior">
            <div class="skeleton__line skeleton__line--answer-title"></div>
          </div>
          <div class="skeleton__answer is-type--ru">
            <div class="skeleton__line skeleton__line--answer-title"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Vocabulary Card Variant -->
    <template v-else-if="variant === 'vocabulary-card'">
      <div class="skeleton__vocabulary-card">
        <div class="skeleton__vocabulary-header">
          <div class="skeleton__line skeleton__line--term-title"></div>
          <div class="skeleton__button"></div>
        </div>
        <div class="skeleton__vocabulary-body">
          <div class="skeleton__translation">
            <div class="skeleton__line skeleton__line--label"></div>
            <div class="skeleton__line skeleton__line--translation-text"></div>
          </div>
          <div class="skeleton__phrases">
            <div class="skeleton__line skeleton__line--label"></div>
            <div class="skeleton__tags">
              <div class="skeleton__tag"></div>
              <div class="skeleton__tag"></div>
              <div class="skeleton__tag"></div>
            </div>
          </div>
          <div class="skeleton__examples">
            <div class="skeleton__line skeleton__line--label"></div>
            <div class="skeleton__example-list">
              <div class="skeleton__line skeleton__line--example"></div>
              <div class="skeleton__line skeleton__line--example"></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Text Variant -->
    <template v-else-if="variant === 'text'">
      <div class="skeleton__text">
        <div
          v-for="(line, index) in textLines"
          :key="index"
          class="skeleton__line skeleton__line--text"
          :style="{ width: line.width }"
        ></div>
      </div>
    </template>

    <!-- Card Variant -->
    <template v-else-if="variant === 'card'">
      <div class="skeleton__card">
        <div class="skeleton__line skeleton__line--card-title"></div>
        <div
          v-for="(line, index) in textLines"
          :key="index"
          class="skeleton__line skeleton__line--text"
          :style="{ width: line.width }"
        ></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    required: true,
    validator: value =>
      ['section-card', 'question', 'vocabulary-card', 'text', 'card'].includes(value),
  },
  lines: { type: Number, default: 3 },
  width: { type: String, default: null },
  height: { type: String, default: null },
  rounded: { type: Boolean, default: true },
});

const skeletonStyle = computed(() => {
  const style = {};
  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  return style;
});

const textLines = computed(() => {
  const widths = ['100%', '95%', '85%', '90%', '80%'];
  return Array.from({ length: props.lines }, (_, i) => ({
    width: widths[i % widths.length],
  }));
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.skeleton {
  position: relative;
  overflow: hidden;

  &--rounded {
    @include rounded-md;
  }
}

// Базовый элемент скелетона - линия
.skeleton__line {
  height: 1rem;
  background: linear-gradient(90deg, $bg-light 0%, lighten($bg-light, 2%) 50%, $bg-light 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
}

// Варианты размеров линий
.skeleton__line--title {
  height: 1.5rem;
  width: 70%;
}

.skeleton__line--question-title {
  height: 1.75rem;
  width: 85%;
}

.skeleton__line--term-title {
  height: 1.75rem;
  width: 60%;
}

.skeleton__line--card-title {
  height: 1.5rem;
  width: 50%;
  margin-bottom: 1rem;
}

.skeleton__line--text {
  height: 1rem;
}

.skeleton__line--answer-title {
  height: 1.25rem;
  width: 40%;
  margin-bottom: 1rem;
}

.skeleton__line--label {
  height: 0.875rem;
  width: 30%;
  margin-bottom: 0.5rem;
}

.skeleton__line--translation-text {
  height: 1.25rem;
  width: 50%;
}

.skeleton__line--link {
  height: 0.875rem;
  width: 40%;
}

.skeleton__line--example {
  height: 1rem;
  width: 90%;
  margin-bottom: 0.5rem;
}

// Section Card Variant
.skeleton__section-card {
  padding: 1.5rem;
  background: $bg-white;
  @include rounded-md;
  border: 1px solid $border-color;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.skeleton__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.skeleton__badge {
  width: 80px;
  height: 1.5rem;
  background: linear-gradient(90deg, $bg-light 0%, lighten($bg-light, 2%) 50%, $bg-light 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton__footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid $border-color;
}

// Question Variant
.skeleton__question {
  margin-bottom: 2rem;
}

.skeleton__question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
}

.skeleton__question-content {
  margin-top: 1rem;
}

.skeleton__code-block {
  height: 150px;
  background: linear-gradient(
    90deg,
    darken($bg-light, 2%) 0%,
    lighten($bg-light, 1%) 50%,
    darken($bg-light, 2%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
  margin: 1rem 0;
  border: 1px solid $border-color;
}

.skeleton__answer {
  margin-top: 1.5rem;
  padding: 1rem;
  background: lighten($bg-light, 1%);
  @include rounded-md;
  &.is-type {
    &--ru {
      background: $answer-ru-bg;
    }
    &--en {
      background: $answer-en-bg;
    }
    &--senior {
      background: $senior-bg;
    }
  }
}

.skeleton__button {
  width: 32px;
  height: 32px;
  background: linear-gradient(90deg, $bg-light 0%, lighten($bg-light, 2%) 50%, $bg-light 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
  flex-shrink: 0;
}

// Vocabulary Card Variant
.skeleton__vocabulary-card {
  background: $bg-white;
  @include rounded-md;
  padding: 1.5rem;
  border: 1px solid $border-color;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.skeleton__vocabulary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid $border-color;
}

.skeleton__vocabulary-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton__translation {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.skeleton__phrases {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skeleton__tag {
  width: 80px;
  height: 1.75rem;
  background: linear-gradient(90deg, $bg-light 0%, lighten($bg-light, 2%) 50%, $bg-light 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton__examples {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton__example-list {
  padding-left: 1rem;
}

// Text Variant
.skeleton__text {
  display: flex;
  flex-direction: column;
}

// Card Variant
.skeleton__card {
  padding: 1.5rem;
  background: $bg-white;
  @include rounded-md;
  border: 1px solid $border-color;
}

// Анимация shimmer
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// Оптимизация производительности
.skeleton__line,
.skeleton__badge,
.skeleton__code-block,
.skeleton__button,
.skeleton__tag {
  will-change: background-position;
}

@include mobile {
  .skeleton__section-card {
    padding: 1rem;
    min-height: 100px;
  }

  .skeleton__vocabulary-card {
    padding: 1rem;
  }

  .skeleton__code-block {
    height: 120px;
  }
}
</style>
