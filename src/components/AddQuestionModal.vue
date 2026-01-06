<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос' }}</h2>
        <button @click="close" class="close-btn">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>Раздел:</label>
          <select v-model="formData.sectionId" required>
            <option value="">Выберите раздел</option>
            <option
              v-for="section in sections"
              :key="section.id"
              :value="section.id"
            >
              {{ section.title }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Номер вопроса:</label>
          <input
            v-model.number="formData.number"
            type="number"
            min="1"
            required
          />
        </div>

        <div class="form-group">
          <label>Вопрос:</label>
          <textarea
            v-model="formData.question"
            rows="3"
            required
            placeholder="Введите текст вопроса"
          />
        </div>

        <div class="form-group">
          <label>Ответ (RU):</label>
          <textarea
            v-model="formData.answerRu"
            rows="5"
            placeholder="Введите ответ на русском"
          />
        </div>

        <div class="form-group">
          <label>Answer (EN):</label>
          <textarea
            v-model="formData.answerEn"
            rows="5"
            placeholder="Enter answer in English"
          />
        </div>

        <div class="form-group">
          <label>Ответ Senior:</label>
          <textarea
            v-model="formData.answerSenior"
            rows="5"
            placeholder="Введите ответ для Senior уровня"
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="close" class="btn-cancel">
            Отмена
          </button>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Сохранение...' : (editingQuestion ? 'Сохранить' : 'Добавить') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { createQuestion, updateQuestion, createAnswer, updateAnswer } from '../api/questions'
import { sections } from '../data/sections.js'

const props = defineProps({
  isOpen: Boolean,
  question: Object
})

const emit = defineEmits(['close', 'saved'])

const loading = ref(false)
const formData = ref({
  sectionId: '',
  number: 1,
  question: '',
  questionRaw: '',
  answerRu: '',
  answerEn: '',
  answerSenior: ''
})

const editingQuestion = computed(() => !!props.question)

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.question) {
    // Заполняем форму данными вопроса
    formData.value = {
      sectionId: props.question.sectionId,
      number: props.question.number,
      question: props.question.question,
      questionRaw: props.question.questionRaw || props.question.question,
      answerRu: props.question.answers?.find(a => a.type === 'ru')?.content || '',
      answerEn: props.question.answers?.find(a => a.type === 'en')?.content || '',
      answerSenior: props.question.answers?.find(a => a.type === 'senior')?.content || ''
    }
  } else if (newVal) {
    // Сброс формы для нового вопроса
    formData.value = {
      sectionId: '',
      number: 1,
      question: '',
      questionRaw: '',
      answerRu: '',
      answerEn: '',
      answerSenior: ''
    }
  }
})

const close = () => {
  emit('close')
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const questionData = {
      sectionId: formData.value.sectionId,
      number: formData.value.number,
      question: formData.value.question,
      questionRaw: formData.value.questionRaw || formData.value.question,
      rawMarkdown: formData.value.question,
      answers: []
    }

    if (formData.value.answerRu) {
      questionData.answers.push({
        type: 'ru',
        content: formData.value.answerRu
      })
    }

    if (formData.value.answerEn) {
      questionData.answers.push({
        type: 'en',
        content: formData.value.answerEn
      })
    }

    if (formData.value.answerSenior) {
      questionData.answers.push({
        type: 'senior',
        content: formData.value.answerSenior
      })
    }

    if (editingQuestion.value) {
      // Обновление существующего вопроса
      await updateQuestion(props.question.id, {
        number: questionData.number,
        question: questionData.question,
        questionRaw: questionData.questionRaw,
        rawMarkdown: questionData.rawMarkdown
      })

      // Обновляем ответы
      const existingAnswers = props.question.answers || []
      for (const answer of questionData.answers) {
        const existing = existingAnswers.find(a => a.type === answer.type)
        if (existing) {
          await updateAnswer(existing.id, { content: answer.content })
        } else {
          await createAnswer(props.question.id, answer)
        }
      }
    } else {
      // Создание нового вопроса
      await createQuestion(questionData)
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('Ошибка сохранения вопроса:', error)
    alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.close-btn:hover {
  color: #000;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-cancel,
.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #42b883;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #35a372;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
