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

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import MarkdownContent from './MarkdownContent.vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: value => ['ru', 'en', 'senior'].includes(value),
  },
  content: {
    type: String,
    required: true,
    default: '',
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(props.defaultOpen);
const innerRef = ref(null);
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
    maxHeight.value = `${innerRef.value.scrollHeight}px`;
  }
};

const toggle = async () => {
  isOpen.value = !isOpen.value;
  await updateMaxHeight();
};

watch(
  () => innerRef.value?.scrollHeight,
  () => {
    if (isOpen.value) {
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
@use '../styles/variables' as *;

.answer {
  &-accordion {
    margin: 1rem 0 2rem 0;

    &.is-answer-ru & {
      margin-top: 1rem;

      &-toggle {
        background: $answer-ru-bg;
        border-color: $answer-ru-border;
        color: $answer-ru-color;

        &:hover {
          background: $answer-ru-hover-bg;
          border-color: $answer-ru-hover-border;
          color: $answer-ru-hover-color;
        }
      }

      &-inner {
        border-top-color: $answer-ru-border;
      }
    }

    &.is-answer-en & {
      margin-top: 1rem;

      &-toggle {
        background: $answer-en-bg;
        border-color: $answer-en-border;
        color: $answer-en-color;

        &:hover {
          background: $answer-en-hover-bg;
          border-color: $answer-en-hover-border;
          color: $answer-en-hover-color;
        }
      }

      &-inner {
        border-top-color: $answer-en-border;
      }
    }

    &.is-answer-senior & {
      margin-top: 1rem;

      &-toggle {
        background: $senior-bg;
        border-color: $senior-border;
        color: $senior-color;

        &:hover {
          background: $senior-hover-bg;
          border-color: $senior-hover-border;
          color: $senior-hover-color;
        }
      }

      &-inner {
        border-top-color: $senior-border;
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
      background: $bg-light;
      border: 1px solid $border-color;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: $text-gray;
      transition: all 0.2s ease;
      user-select: none;
      margin: 0;
      font-family: inherit;

      &:hover {
        background: #e9ecef;
        border-color: $primary-color;
        color: $primary-color;

        .answer-accordion-icon {
          color: $primary-color;
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
      color: $text-lighter-gray;
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
      border-top: 1px solid #f0f0f0;
      margin-top: 0.5rem;

      // Подсветка кода внутри аккордеонов
      :deep(pre) {
        background: $code-bg-dark !important;

        code,
        code.hljs {
          background: transparent !important;
          color: $code-text !important;
        }
      }

      :deep(.hljs-keyword) {
        color: #569cd6 !important;
      }

      :deep(.hljs-string) {
        color: #ce9178 !important;
      }

      :deep(.hljs-comment) {
        color: #6a9955 !important;
        font-style: italic !important;
      }

      :deep(.hljs-number),
      :deep(.hljs-literal) {
        color: #b5cea8 !important;
      }

      :deep(.hljs-function),
      :deep(.hljs-title:not(.hljs-class):not(.hljs-type)) {
        color: #dcdcaa !important;
      }

      :deep(.hljs-type),
      :deep(.hljs-class) {
        color: #4ec9b0 !important;
      }

      :deep(.hljs-variable),
      :deep(.hljs-params) {
        color: #9cdcfe !important;
      }

      :deep(.hljs-property),
      :deep(.hljs-attr) {
        color: #92c5f7 !important;
      }

      :deep(.hljs-built_in) {
        color: #569cd6 !important;
      }

      :deep(.hljs-regexp) {
        color: #d16969 !important;
      }
    }
  }
}
</style>
