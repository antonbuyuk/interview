<template>
  <article class="question-item">
    <div
      :id="`question-${question.number}`"
      :data-question-id="question.id"
      class="question-item__header"
      @mouseover="handleMouseOver"
      @mouseout="handleMouseOut"
    >
      <h3 v-html="highlightedQuestion"></h3>
      <div v-if="isAdmin" class="question-item__actions">
        <div class="question-item__drag-handle" title="Перетащить для изменения порядка">
          <svg
            class="question-item__drag-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
            />
          </svg>
        </div>
        <button
          class="question-item__edit-btn"
          type="button"
          title="Редактировать вопрос"
          @click="handleEdit"
        >
          <PencilIcon class="question-item__icon" />
        </button>
      </div>
    </div>

    <CodeBlock
      v-for="(codeBlock, index) in question.codeBlocks"
      :key="index"
      :code="codeBlock.code"
      :language="codeBlock.language || ''"
    />

    <template v-for="answer in sortedAnswers">
      <AnswerAccordion
        v-if="englishOnly ? answer.type === 'en' : true"
        :key="answer.type"
        :type="answer.type"
        :content="answer.content"
      />
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CodeBlock from './CodeBlock.vue';
import AnswerAccordion from './AnswerAccordion.vue';
import { PencilIcon } from '@heroicons/vue/24/outline';
import { useDictionaryHighlight } from '../composables/useDictionaryHighlight';

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  englishOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['edit-question', 'term-hover']);

const { highlightTermsInText } = useDictionaryHighlight();

const sortedAnswers = computed(() => {
  const answers = props.question.answers || [];
  // Сортируем ответы: ru, en, senior
  const order = { ru: 0, en: 1, senior: 2 };
  return [...answers].sort((a, b) => {
    return (
      (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99)
    );
  });
});

const questionText = computed(() => {
  // Если включен режим englishOnly и есть английский перевод вопроса, используем его
  const questionContent =
    props.englishOnly && props.question.questionEn
      ? props.question.questionEn
      : props.question.questionRaw || props.question.question;

  return `${props.question.number}. ${questionContent}`;
});

const highlightedQuestion = computed(() => {
  return highlightTermsInText(questionText.value);
});

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const handleMouseOver = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target && target.classList.contains('dictionary-term')) {
    // Отменяем предыдущий таймер скрытия
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }

    const termId = target.getAttribute('data-term-id');
    const termName = target.getAttribute('data-term');
    if (termId && termName) {
      const rect = target.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent('term-hover', {
          detail: {
            term: { id: termId, term: termName },
            position: {
              x: rect.left + rect.width / 2,
              y: rect.top,
            },
          },
        })
      );
    }
  }
};

const handleMouseOut = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target && target.classList.contains('dictionary-term')) {
    // Добавляем задержку перед скрытием, чтобы пользователь успел навести на tooltip
    hoverTimer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('term-hover', {
          detail: null,
        })
      );
      hoverTimer = null;
    }, 200);
  }
};

const handleEdit = () => {
  emit('edit-question', props.question);
};

// Словарь загружается глобально в App.vue
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.question-item {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }

  &__header {
    font-size: 1.25rem;
    font-weight: 600;
    padding-top: 1rem;
    padding-bottom: 0.5rem;
    color: $primary-color;
    line-height: 1.5;
    scroll-margin-top: 120px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    &:not(:last-child) {
      margin-bottom: 2rem;
    }

    &[id] {
      &::before {
        content: '';
        display: block;
        height: 120px;
        visibility: hidden;
        position: absolute;
        left: 0;
        top: -120px;
      }
    }

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.125rem;
      margin: 1.5rem 0 0.75rem 0;
      padding-top: 0.75rem;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  &__drag-handle {
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    opacity: 0.5;
    @include transition(all, 0.2s, ease);
    border-radius: 4px;

    &:hover {
      opacity: 1;
      background: rgba(66, 184, 131, 0.1);
    }

    &:active {
      cursor: grabbing;
    }
  }

  &__drag-icon {
    width: 1rem;
    height: 1rem;
    color: $text-gray;
  }

  &__edit-btn {
    background: rgba(66, 184, 131, 0.1);
    border: 1px solid rgba(66, 184, 131, 0.3);
    border-radius: 6px;
    padding: 0.375rem 0.625rem;
    cursor: pointer;
    font-size: 0.875rem;
    @include transition(all, 0.2s, ease);
    flex-shrink: 0;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(66, 184, 131, 0.2);
      border-color: $primary-color;
      opacity: 1;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    @media (max-width: $breakpoint-mobile) {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  }

  &__icon {
    width: 0.875rem;
    height: 0.875rem;
    color: inherit;

    @media (max-width: $breakpoint-mobile) {
      width: 0.75rem;
      height: 0.75rem;
    }
  }

  &--hidden {
    display: none !important;
  }
}

// Стили для подсвеченных терминов
:deep(.dictionary-term) {
  position: relative;
  cursor: help;
  @include transition(all, 0.2s, ease);
  background-color: rgba(66, 184, 131, 0.15);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;

  &:hover {
    background-color: rgba(66, 184, 131, 0.25);
    color: $primary-color;
  }
}
</style>
