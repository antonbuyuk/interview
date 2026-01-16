<template>
  <div class="answer-accordion" :class="{ open: isOpen, [`is-answer-${type}`]: true }">
    <button class="answer-accordion-toggle" type="button" :aria-expanded="isOpen" @click="toggle">
      <ChevronRightIcon class="answer-accordion-icon" />
      <span class="answer-accordion-label">{{ label }}</span>
    </button>
    <div
      ref="contentRef"
      class="answer-accordion-content"
      :style="{ maxHeight: isOpen ? maxHeight : '0' }"
    >
      <div ref="innerRef" class="answer-accordion-inner">
        <MarkdownContent :markdown="content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import MarkdownContent from '../content/MarkdownContent.vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  type: 'ru' | 'en' | 'senior';
  content: string;
  defaultOpen?: boolean;
}>();

const isOpen = ref(props.defaultOpen);
const innerRef = ref<HTMLElement | null>(null);
const maxHeight = ref('0');

const label = computed(() => {
  switch (props.type) {
    case 'ru':
      return 'Ответ RU';
    case 'en':
      return 'Answer EN';
    case 'senior':
      return 'Ответ Senior';
    default:
      return 'Показать ответ';
  }
});

const updateMaxHeight = async () => {
  await nextTick();
  if (innerRef.value && isOpen.value) {
    const scrollHeight = innerRef.value.scrollHeight;
    if (scrollHeight !== undefined) {
      maxHeight.value = `${scrollHeight}px`;
    }
  }
};

const toggle = async () => {
  isOpen.value = !isOpen.value;
  await updateMaxHeight();
};

watch(
  () => innerRef.value?.scrollHeight,
  (scrollHeight: number | undefined) => {
    if (isOpen.value && scrollHeight !== undefined) {
      updateMaxHeight();
    }
  }
);

onMounted(() => {
  if (props.defaultOpen) {
    updateMaxHeight();
  }
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.answer {
  &-accordion {
    &:not(:last-child) {
      margin-bottom: 2rem;
    }

    &.is-answer-ru & {
      margin-top: 1rem;

      &-toggle {
        background: var(--answer-ru-bg);
        border-color: var(--answer-ru-border);
        color: var(--answer-ru-color);

        &:hover {
          background: var(--answer-ru-hover-bg);
          border-color: var(--answer-ru-hover-border);
          color: var(--answer-ru-hover-color);
        }
      }

      &-inner {
        border-top-color: var(--answer-ru-border);
      }
    }

    &.is-answer-en & {
      margin-top: 1rem;

      &-toggle {
        background: var(--answer-en-bg);
        border-color: var(--answer-en-border);
        color: var(--answer-en-color);

        &:hover {
          background: var(--answer-en-hover-bg);
          border-color: var(--answer-en-hover-border);
          color: var(--answer-en-hover-color);
        }
      }

      &-inner {
        border-top-color: var(--answer-en-border);
      }
    }

    &.is-answer-senior & {
      margin-top: 1rem;

      &-toggle {
        background: var(--senior-bg);
        border-color: var(--senior-border);
        color: var(--senior-color);

        &:hover {
          background: var(--senior-hover-bg);
          border-color: var(--senior-hover-border);
          color: var(--senior-hover-color);
        }
      }

      &-inner {
        border-top-color: var(--senior-border);
      }
    }

    &.open &-icon {
      transform: rotate(90deg);
    }

    &-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-gray);
      @include transition(all, 0.2s, ease);
      user-select: none;
      margin: 0;
      font-family: inherit;

      &:hover {
        background: var(--hover-bg-strong);
        border-color: var(--primary-color);
        color: var(--primary-color);

        .answer-accordion-icon {
          color: var(--primary-color);
        }
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
      }

      @media (max-width: $breakpoint-mobile) {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
      }
    }

    &-icon {
      display: inline-block;
      transition: transform 0.3s ease;
      color: var(--text-lighter-gray);
      width: 0.75rem;
      height: 0.75rem;
      flex-shrink: 0;
    }

    &-label {
      flex: 1;
      text-align: left;
    }

    &-content {
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    &-inner {
      padding: 1rem 0;
      border-top: 1px solid var(--border-color);
      margin-top: 0.5rem;

      // Подсветка кода внутри аккордеонов
      :deep(pre) {
        code,
        code.hljs {
          background: transparent !important;
          color: #d4d4d4 !important;
        }
      }
    }
  }
}
</style>
