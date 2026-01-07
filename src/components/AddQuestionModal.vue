<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Раздел:</label>
          <select v-model="formData.sectionId" required :disabled="sectionsLoading">
            <option value="">{{ sectionsLoading ? 'Загрузка...' : 'Выберите раздел' }}</option>
            <option v-for="section in sections" :key="section.id" :value="section.id">
              {{ section.title }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Номер вопроса:</label>
          <input v-model.number="formData.number" type="number" min="1" required />
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
          <label>Ответы:</label>
          <div class="tabs-container">
            <div class="tabs-header">
              <button
                type="button"
                class="tab-button"
                :class="{ active: activeTab === 'ru' }"
                @click="activeTab = 'ru'"
              >
                Ответ (RU)
              </button>
              <button
                type="button"
                class="tab-button"
                :class="{ active: activeTab === 'en' }"
                @click="activeTab = 'en'"
              >
                Answer (EN)
              </button>
              <button
                type="button"
                class="tab-button"
                :class="{ active: activeTab === 'senior' }"
                @click="activeTab = 'senior'"
              >
                Ответ Senior
              </button>
            </div>

            <div class="tabs-content">
              <div v-show="activeTab === 'ru'" class="tab-panel">
                <div v-if="editorRu" class="editor-toolbar">
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('bold') }"
                    title="Жирный (Ctrl+B)"
                    @click="editorRu.chain().focus().toggleBold().run()"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('italic') }"
                    title="Курсив (Ctrl+I)"
                    @click="editorRu.chain().focus().toggleItalic().run()"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('code') }"
                    title="Код"
                    @click="editorRu.chain().focus().toggleCode().run()"
                  >
                    &lt;/&gt;
                  </button>
                  <div class="toolbar-divider"></div>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('heading', { level: 2 }) }"
                    title="Заголовок 2"
                    @click="editorRu.chain().focus().toggleHeading({ level: 2 }).run()"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('heading', { level: 3 }) }"
                    title="Заголовок 3"
                    @click="editorRu.chain().focus().toggleHeading({ level: 3 }).run()"
                  >
                    H3
                  </button>
                  <div class="toolbar-divider"></div>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('bulletList') }"
                    title="Маркированный список"
                    @click="editorRu.chain().focus().toggleBulletList().run()"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('orderedList') }"
                    title="Нумерованный список"
                    @click="editorRu.chain().focus().toggleOrderedList().run()"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorRu.isActive('codeBlock') }"
                    title="Блок кода"
                    @click="editorRu.chain().focus().toggleCodeBlock().run()"
                  >
                    { }
                  </button>
                </div>
                <EditorContent :editor="editorRu" />
              </div>
              <div v-show="activeTab === 'en'" class="tab-panel">
                <div v-if="editorEn" class="editor-toolbar">
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('bold') }"
                    title="Bold (Ctrl+B)"
                    @click="editorEn.chain().focus().toggleBold().run()"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('italic') }"
                    title="Italic (Ctrl+I)"
                    @click="editorEn.chain().focus().toggleItalic().run()"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('code') }"
                    title="Code"
                    @click="editorEn.chain().focus().toggleCode().run()"
                  >
                    &lt;/&gt;
                  </button>
                  <div class="toolbar-divider"></div>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('heading', { level: 2 }) }"
                    title="Heading 2"
                    @click="editorEn.chain().focus().toggleHeading({ level: 2 }).run()"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('heading', { level: 3 }) }"
                    title="Heading 3"
                    @click="editorEn.chain().focus().toggleHeading({ level: 3 }).run()"
                  >
                    H3
                  </button>
                  <div class="toolbar-divider"></div>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('bulletList') }"
                    title="Bullet List"
                    @click="editorEn.chain().focus().toggleBulletList().run()"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('orderedList') }"
                    title="Ordered List"
                    @click="editorEn.chain().focus().toggleOrderedList().run()"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorEn.isActive('codeBlock') }"
                    title="Code Block"
                    @click="editorEn.chain().focus().toggleCodeBlock().run()"
                  >
                    { }
                  </button>
                </div>
                <EditorContent :editor="editorEn" />
              </div>
              <div v-show="activeTab === 'senior'" class="tab-panel">
                <div v-if="editorSenior" class="editor-toolbar">
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('bold') }"
                    title="Жирный (Ctrl+B)"
                    @click="editorSenior.chain().focus().toggleBold().run()"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('italic') }"
                    title="Курсив (Ctrl+I)"
                    @click="editorSenior.chain().focus().toggleItalic().run()"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('code') }"
                    title="Код"
                    @click="editorSenior.chain().focus().toggleCode().run()"
                  >
                    &lt;/&gt;
                  </button>
                  <div class="toolbar-divider"></div>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('heading', { level: 2 }) }"
                    title="Заголовок 2"
                    @click="editorSenior.chain().focus().toggleHeading({ level: 2 }).run()"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('heading', { level: 3 }) }"
                    title="Заголовок 3"
                    @click="editorSenior.chain().focus().toggleHeading({ level: 3 }).run()"
                  >
                    H3
                  </button>
                  <div class="toolbar-divider"></div>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('bulletList') }"
                    title="Маркированный список"
                    @click="editorSenior.chain().focus().toggleBulletList().run()"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('orderedList') }"
                    title="Нумерованный список"
                    @click="editorSenior.chain().focus().toggleOrderedList().run()"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    class="toolbar-btn"
                    :class="{ active: editorSenior.isActive('codeBlock') }"
                    title="Блок кода"
                    @click="editorSenior.chain().focus().toggleCodeBlock().run()"
                  >
                    { }
                  </button>
                </div>
                <EditorContent :editor="editorSenior" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            v-if="editingQuestion && isAdmin"
            type="button"
            class="btn-delete"
            :disabled="loading || deleting"
            @click="handleDelete"
          >
            {{ deleting ? 'Удаление...' : '🗑️ Удалить вопрос' }}
          </button>
          <button type="button" class="btn-cancel" @click="close">Отмена</button>
          <button v-if="isAdmin" type="submit" class="btn-submit" :disabled="loading || deleting">
            {{ loading ? 'Сохранение...' : editingQuestion ? 'Сохранить' : 'Добавить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import { marked } from 'marked';
import TurndownService from 'turndown';
import {
  createQuestion,
  updateQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  deleteQuestion,
  getQuestions,
} from '../api/questions';
import { getSections } from '../api/sections';

// Инициализация Turndown для конвертации HTML в Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  question: { type: Object, default: null },
  defaultSectionId: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'saved', 'deleted']);

const loading = ref(false);
const deleting = ref(false);
const sections = ref([]);
const sectionsLoading = ref(false);
const activeTab = ref('ru');

const formData = ref({
  sectionId: '',
  number: 1,
  question: '',
  questionRaw: '',
});

const editingQuestion = computed(() => !!props.question);

// TipTap редакторы
const editorRu = useEditor({
  extensions: [StarterKit, CodeBlock],
  content: '',
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
    },
  },
});

const editorEn = useEditor({
  extensions: [StarterKit, CodeBlock],
  content: '',
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
    },
  },
});

const editorSenior = useEditor({
  extensions: [StarterKit, CodeBlock],
  content: '',
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
    },
  },
});

// Загрузка секций из API
const loadSections = async () => {
  sectionsLoading.value = true;
  try {
    sections.value = await getSections();
  } catch (error) {
    console.error('Ошибка загрузки секций:', error);
    alert('Ошибка загрузки секций: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    sectionsLoading.value = false;
  }
};

// Вычисление следующего номера вопроса для выбранного раздела
const calculateNextQuestionNumber = async sectionId => {
  if (!sectionId) {
    return 1;
  }

  try {
    const questions = await getQuestions(sectionId);
    if (questions.length === 0) {
      return 1;
    }
    const maxNumber = Math.max(...questions.map(q => q.number));
    return maxNumber + 1;
  } catch (error) {
    console.error('Ошибка вычисления следующего номера:', error);
    return 1;
  }
};

onMounted(() => {
  loadSections();
});

onBeforeUnmount(() => {
  if (editorRu.value) {
    editorRu.value.destroy();
  }
  if (editorEn.value) {
    editorEn.value.destroy();
  }
  if (editorSenior.value) {
    editorSenior.value.destroy();
  }
});

watch(
  () => props.isOpen,
  newVal => {
    if (newVal && props.question) {
      // Заполняем форму данными вопроса
      formData.value = {
        sectionId: props.question.sectionId,
        number: props.question.number,
        question: props.question.question,
        questionRaw: props.question.questionRaw || props.question.question,
      };

      // Загружаем контент в редакторы (конвертируем markdown в HTML)
      const answerRu = props.question.answers?.find(a => a.type === 'ru')?.content || '';
      const answerEn = props.question.answers?.find(a => a.type === 'en')?.content || '';
      const answerSenior = props.question.answers?.find(a => a.type === 'senior')?.content || '';

      if (editorRu.value) {
        const htmlRu = answerRu ? marked.parse(answerRu) : '';
        editorRu.value.commands.setContent(htmlRu);
      }
      if (editorEn.value) {
        const htmlEn = answerEn ? marked.parse(answerEn) : '';
        editorEn.value.commands.setContent(htmlEn);
      }
      if (editorSenior.value) {
        const htmlSenior = answerSenior ? marked.parse(answerSenior) : '';
        editorSenior.value.commands.setContent(htmlSenior);
      }

      // Устанавливаем первый таб с контентом
      if (answerRu) activeTab.value = 'ru';
      else if (answerEn) activeTab.value = 'en';
      else if (answerSenior) activeTab.value = 'senior';
    } else if (newVal) {
      // Сброс формы для нового вопроса
      const defaultSectionId = props.defaultSectionId || '';
      formData.value = {
        sectionId: defaultSectionId,
        number: 1,
        question: '',
        questionRaw: '',
      };

      // Вычисляем следующий номер для выбранного раздела
      if (defaultSectionId) {
        calculateNextQuestionNumber(defaultSectionId).then(nextNumber => {
          formData.value.number = nextNumber;
        });
      }

      // Очищаем редакторы
      if (editorRu.value) {
        editorRu.value.commands.clearContent();
      }
      if (editorEn.value) {
        editorEn.value.commands.clearContent();
      }
      if (editorSenior.value) {
        editorSenior.value.commands.clearContent();
      }

      activeTab.value = 'ru';
    }
  }
);

// Отслеживаем изменение раздела для автоматического вычисления номера
watch(
  () => formData.value.sectionId,
  async (newSectionId, oldSectionId) => {
    // Обновляем номер только при создании нового вопроса (не при редактировании)
    if (!editingQuestion.value && newSectionId && newSectionId !== oldSectionId) {
      const nextNumber = await calculateNextQuestionNumber(newSectionId);
      formData.value.number = nextNumber;
    }
  }
);

const close = () => {
  // Очищаем редакторы при закрытии
  if (editorRu.value) {
    editorRu.value.commands.clearContent();
  }
  if (editorEn.value) {
    editorEn.value.commands.clearContent();
  }
  if (editorSenior.value) {
    editorSenior.value.commands.clearContent();
  }
  activeTab.value = 'ru';
  emit('close');
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    // Получаем контент из редакторов
    const answerRu = editorRu.value?.getHTML() || '';
    const answerEn = editorEn.value?.getHTML() || '';
    const answerSenior = editorSenior.value?.getHTML() || '';

    // Конвертируем HTML в markdown
    const htmlToMarkdown = html => {
      if (!html || html.trim() === '' || html === '<p></p>' || html === '<p><br></p>') return '';
      try {
        const markdown = turndownService.turndown(html);
        return markdown.trim();
      } catch (error) {
        console.error('Ошибка конвертации HTML в Markdown:', error);
        return '';
      }
    };

    const questionData = {
      sectionId: formData.value.sectionId,
      number: formData.value.number,
      question: formData.value.question,
      questionRaw: formData.value.questionRaw || formData.value.question,
      rawMarkdown: formData.value.question,
      answers: [],
    };

    const markdownRu = htmlToMarkdown(answerRu);
    const markdownEn = htmlToMarkdown(answerEn);
    const markdownSenior = htmlToMarkdown(answerSenior);

    if (markdownRu) {
      questionData.answers.push({
        type: 'ru',
        content: markdownRu,
      });
    }

    if (markdownEn) {
      questionData.answers.push({
        type: 'en',
        content: markdownEn,
      });
    }

    if (markdownSenior) {
      questionData.answers.push({
        type: 'senior',
        content: markdownSenior,
      });
    }

    if (editingQuestion.value) {
      // Обновление существующего вопроса
      await updateQuestion(props.question.id, {
        sectionId: questionData.sectionId,
        number: questionData.number,
        question: questionData.question,
        questionRaw: questionData.questionRaw,
        rawMarkdown: questionData.rawMarkdown,
      });

      // Обновляем ответы
      const existingAnswers = props.question.answers || [];
      const answerTypesInForm = questionData.answers.map(a => a.type);

      // Обновляем или создаем ответы из формы
      for (const answer of questionData.answers) {
        const existing = existingAnswers.find(a => a.type === answer.type);
        if (existing) {
          await updateAnswer(existing.id, { content: answer.content });
        } else {
          await createAnswer(props.question.id, answer);
        }
      }

      // Удаляем ответы, которые были удалены из формы
      for (const existing of existingAnswers) {
        if (!answerTypesInForm.includes(existing.type)) {
          await deleteAnswer(existing.id);
        }
      }
    } else {
      // Создание нового вопроса
      await createQuestion(questionData);
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Ошибка сохранения вопроса:', error);
    alert('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  if (!editingQuestion.value || !props.question) {
    return;
  }

  const questionText = props.question.question?.substring(0, 50) || 'этот вопрос';
  if (
    !confirm(
      `Вы уверены, что хотите удалить вопрос "${questionText}${props.question.question?.length > 50 ? '...' : ''}"?\n\nЭто действие нельзя отменить.`
    )
  ) {
    return;
  }

  deleting.value = true;
  try {
    await deleteQuestion(props.question.id);
    emit('deleted', props.question.id);
    close();
  } catch (error) {
    console.error('Ошибка удаления вопроса:', error);
    alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    deleting.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use '../styles/modals' as *;
</style>
