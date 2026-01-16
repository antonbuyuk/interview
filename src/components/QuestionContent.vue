<template>
  <article ref="contentRef" class="question-content">
    <draggable
      v-if="isAdmin"
      v-model="localQuestions"
      :animation="200"
      handle=".question-item__drag-handle"
      item-key="id"
      @end="handleDragEnd"
      class="draggable-list"
    >
      <template #item="{ element: question }">
        <QuestionItem
          :key="question.id"
          :question="question"
          :is-admin="isAdmin"
          :english-only="englishOnly"
          @edit-question="handleEditQuestion"
        />
      </template>
    </draggable>

    <template v-else>
      <QuestionItem
        v-for="question in questions"
        :key="question.id"
        :question="question"
        :is-admin="isAdmin"
        :english-only="englishOnly"
        @edit-question="handleEditQuestion"
      />
    </template>
  </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { useTrainingMode } from '../composables/useTrainingMode';
import QuestionItem from './QuestionItem.vue';
import { reorderQuestions } from '../api/questions';
import type { Question } from '../types/api';

const props = defineProps({
  questions: { type: Array as () => Question[], default: () => [] },
  isAdmin: { type: Boolean, default: false },
  sectionId: { type: String, default: '' },
});

const emit = defineEmits(['edit-question', 'reordered']);

const { englishOnly } = useTrainingMode();

// Local copy of questions for drag & drop
const localQuestions = ref<Question[]>([]);

// Sync localQuestions with props.questions
watch(
  () => props.questions,
  (newQuestions) => {
    localQuestions.value = [...newQuestions];
  },
  { immediate: true, deep: true }
);

const handleEditQuestion = (question: Question) => {
  emit('edit-question', question);
};

const handleDragEnd = async () => {
  if (!props.isAdmin || !props.sectionId) {
    return;
  }

  try {
    // Extract question IDs in the new order
    const questionIds = localQuestions.value.map((q) => q.id);

    // Call API to update order
    await reorderQuestions(questionIds, props.sectionId);

    // Emit event to parent to reload questions
    emit('reordered');
  } catch (error) {
    console.error('Ошибка изменения порядка вопросов:', error);
    // Revert to original order on error
    localQuestions.value = [...props.questions];
    alert('Не удалось изменить порядок вопросов. Попробуйте еще раз.');
  }
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

.draggable-list {
  display: flex;
  flex-direction: column;
}

// Styles for drag & drop
:deep(.sortable-ghost) {
  opacity: 0.4;
  background: rgba(66, 184, 131, 0.1);
}

:deep(.sortable-drag) {
  opacity: 0.8;
}
</style>
