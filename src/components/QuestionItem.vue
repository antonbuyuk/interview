<template>
  <article class="question-item">
    <div
      :id="`question-${question.number}`"
      :data-question-id="question.id"
      class="question-header"
    >
      <h3>{{ question.number }}. {{ question.questionRaw || question.question }}</h3>
      <button
        v-if="isAdmin"
        class="edit-question-btn"
        type="button"
        title="Редактировать вопрос"
        @click="handleEdit"
      >
        <PencilIcon class="icon-small" />
      </button>
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

<script setup>
import { computed } from 'vue';
import CodeBlock from './CodeBlock.vue';
import AnswerAccordion from './AnswerAccordion.vue';
import { PencilIcon } from '@heroicons/vue/24/outline';

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

const emit = defineEmits(['edit-question']);

const sortedAnswers = computed(() => {
  const answers = props.question.answers || [];
  // Сортируем ответы: ru, en, senior
  const order = { ru: 0, en: 1, senior: 2 };
  return [...answers].sort((a, b) => {
    return (order[a.type] || 99) - (order[b.type] || 99);
  });
});

const handleEdit = () => {
  emit('edit-question', props.question);
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.question-item {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.question-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
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

.edit-question-btn {
  background: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-small {
    width: 0.875rem;
    height: 0.875rem;
    color: inherit;
  }

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

    .icon-small {
      width: 0.75rem;
      height: 0.75rem;
    }
  }
}

.hidden-in-english-only {
  display: none !important;
}
</style>
