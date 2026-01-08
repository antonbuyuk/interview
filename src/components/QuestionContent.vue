<template>
  <article ref="contentRef" class="question-content">
    <QuestionItem
      v-for="question in questions"
      :key="question.id"
      :question="question"
      :is-admin="isAdmin"
      :english-only="englishOnly"
      @edit-question="handleEditQuestion"
    />
  </article>
</template>

<script setup lang="ts">
import { useTrainingMode } from '../composables/useTrainingMode';
import QuestionItem from './QuestionItem.vue';

defineProps({
  questions: { type: Array as () => any[], default: () => [] },
  isAdmin: { type: Boolean, default: false },
});

const emit = defineEmits(['edit-question']);

const { englishOnly } = useTrainingMode();

const handleEditQuestion = (question: any) => {
  emit('edit-question', question);
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.question-content {
  background: $bg-white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.8;
  max-width: 60rem;
  margin-inline: auto;

  @media (max-width: $breakpoint-mobile) {
    max-width: 100%;
    padding: 1rem;
    border-radius: 0;
    font-size: 0.9375rem;
  }
}
</style>
