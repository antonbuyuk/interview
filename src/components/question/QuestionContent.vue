<template>
  <article ref="contentRef" class="question-content">
    <draggable
      v-if="isAdmin"
      v-model="localQuestions"
      :animation="200"
      handle=".question-item__drag-handle"
      item-key="id"
      class="draggable-list"
      @end="handleDragEnd"
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
      <div
        v-if="questions.length > 20"
        ref="virtualizerParentRef"
        class="virtual-container"
        style="height: 100%; overflow: auto"
      >
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
          <QuestionItem
            v-for="virtualRow in virtualizer.getVirtualItems()"
            :key="String(virtualRow.key)"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }"
            :question="questions[virtualRow.index]!"
            :is-admin="isAdmin"
            :english-only="englishOnly"
            @edit-question="handleEditQuestion"
          />
        </div>
      </div>
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
    </template>
  </article>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import draggable from 'vuedraggable';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { useTrainingMode } from '../../composables/useTrainingMode';
import QuestionItem from './QuestionItem.vue';
import { reorderQuestions } from '../../api/questions';
import type { Question } from '../../types/api';

const props = defineProps({
  questions: { type: Array as () => Question[], default: () => [] },
  isAdmin: { type: Boolean, default: false },
  sectionId: { type: String, default: '' },
});

const emit = defineEmits(['edit-question', 'reordered']);

const { englishOnly } = useTrainingMode();

// Local copy of questions for drag & drop
const localQuestions = ref<Question[]>([]);

// Виртуализация для больших списков
const virtualizerParentRef = ref<HTMLElement | null>(null);
const questionsCount = computed(() => props.questions.length);
const virtualizer = useVirtualizer({
  // @tanstack/vue-virtual принимает computed ref напрямую

  count: questionsCount as any,
  getScrollElement: () => virtualizerParentRef.value,
  estimateSize: () => 200, // Примерная высота одного вопроса
  overscan: 5, // Количество элементов для предзагрузки
});

// Sync localQuestions with props.questions
watch(
  () => props.questions,
  newQuestions => {
    localQuestions.value = [...newQuestions];
  },
  { immediate: true, deep: true }
);

const handleEditQuestion = (question: Question) => {
  emit('edit-question', question);
};

const handleDragEnd = async (): Promise<void> => {
  if (!props.isAdmin || !props.sectionId) {
    return;
  }

  try {
    // Extract question IDs in the new order
    const questionIds = localQuestions.value.map(q => q.id);

    // Call API to update order
    await reorderQuestions(questionIds, props.sectionId);

    // Emit event to parent to reload questions
    emit('reordered');
  } catch (error) {
    console.error('Ошибка изменения порядка вопросов:', error);
    // Revert to original order on error
    localQuestions.value = [...props.questions];
    const { showToast } = await import('../../composables/useToast');
    showToast('Не удалось изменить порядок вопросов. Попробуйте еще раз.', 'error');
  }
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.draggable-list {
  display: flex;
  flex-direction: column;
}

.virtual-container {
  width: 100%;
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
