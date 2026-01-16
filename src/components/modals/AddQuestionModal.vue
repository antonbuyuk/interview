<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос' }}</h2>
        <button class="close-btn" @click="close">
          <XMarkIcon class="icon-small" />
        </button>
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
          <label>Вопрос:</label>
          <textarea
            v-model="formData.question"
            rows="3"
            required
            placeholder="Введите текст вопроса"
            @input="formData.questionRaw = formData.question"
          />
        </div>

        <div class="form-group">
          <div class="form-group-header">
            <label>Вопрос на английском (Question in English):</label>
            <button
              type="button"
              class="btn-translate"
              :disabled="!formData.questionRaw || translating"
              @click="handleAutoTranslate"
            >
              {{ translating ? 'Перевод...' : 'Перевести автоматически' }}
            </button>
          </div>
          <textarea
            v-model="formData.questionEn"
            rows="3"
            placeholder="Введите текст вопроса на английском (необязательно)"
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
            <template v-if="!deleting">
              <TrashIcon class="icon-inline" />
              Удалить вопрос
            </template>
            <template v-else>Удаление...</template>
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

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import TurndownService from 'turndown';
import { useToast } from '../../composables/useToast';

// Динамический импорт для тяжелой библиотеки
let marked: typeof import('marked') | null = null;
const loadMarked = async () => {
  if (!marked) {
    marked = await import('marked');
  }
  return marked;
};
import {
  createQuestion,
  updateQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  deleteQuestion,
  translateText,
} from '../../api/questions';
import { useSectionsStore } from '../../stores/sections';
import { TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { Question, CreateAnswerRequest } from '../../types/api';

// Инициализация Turndown для конвертации HTML в Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

const props = defineProps<{
  isOpen?: boolean;
  question?: Question | null;
  defaultSectionId?: string;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
  deleted: [id: string];
}>();

const loading = ref(false);
const deleting = ref(false);
const translating = ref(false);
const sectionsStore = useSectionsStore();
const { sections, loading: sectionsLoading } = sectionsStore;
const activeTab = ref<'ru' | 'en' | 'senior'>('ru');
const { showToast } = useToast();
const formData = ref({
  sectionId: '',
  number: 1,
  question: '',
  questionRaw: '',
  questionEn: '',
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

onMounted(() => {
  // Секции уже загружены в App.vue через store
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
  async (newVal: boolean) => {
    if (newVal && props.question) {
      // Заполняем форму данными вопроса
      formData.value = {
        sectionId: props.question.sectionId,
        number: props.question.number,
        question: props.question.question,
        questionRaw: props.question.questionRaw || props.question.question,
        questionEn: props.question.questionEn || '',
      };

      // Загружаем контент в редакторы (конвертируем markdown в HTML)
      const answerRu = props.question.answers?.find(a => a.type === 'ru')?.content || '';
      const answerEn = props.question.answers?.find(a => a.type === 'en')?.content || '';
      const answerSenior = props.question.answers?.find(a => a.type === 'senior')?.content || '';

      // Загружаем marked если еще не загружен
      await loadMarked();

      if (editorRu.value && marked) {
        const htmlRu = answerRu ? marked.parse(answerRu) : '';
        editorRu.value.commands.setContent(htmlRu);
      }
      if (editorEn.value && marked) {
        const htmlEn = answerEn ? marked.parse(answerEn) : '';
        editorEn.value.commands.setContent(htmlEn);
      }
      if (editorSenior.value && marked) {
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
        number: 1, // Всегда создаем с номером 1 (в начале списка)
        question: '',
        questionRaw: '',
        questionEn: '',
      };

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
    const htmlToMarkdown = (html: string): string => {
      if (!html || html.trim() === '' || html === '<p></p>' || html === '<p><br></p>') return '';
      try {
        const markdown = turndownService.turndown(html);
        return markdown.trim();
      } catch (error) {
        console.error('Ошибка конвертации HTML в Markdown:', error);
        showToast('Ошибка конвертации HTML в Markdown', 'error');
        return '';
      }
    };

    const questionData: {
      sectionId: string;
      number: number;
      question: string;
      questionRaw: string;
      questionEn: string | null;
      rawMarkdown: string;
      answers: CreateAnswerRequest[];
    } = {
      sectionId: formData.value.sectionId,
      number: formData.value.number,
      question: formData.value.question,
      questionRaw: formData.value.questionRaw || formData.value.question,
      questionEn: formData.value.questionEn || null,
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

    if (editingQuestion.value && props.question) {
      // Обновление существующего вопроса (номер не изменяется при редактировании, только через drag & drop)
      await updateQuestion(props.question.id, {
        sectionId: questionData.sectionId,
        question: questionData.question,
        questionRaw: questionData.questionRaw,
        questionEn: questionData.questionEn,
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
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    showToast('Ошибка сохранения: ' + errorMessage, 'error');
  } finally {
    loading.value = false;
  }
};

const handleAutoTranslate = async () => {
  if (!formData.value.questionRaw || formData.value.questionRaw.trim() === '') {
    showToast('Сначала введите текст вопроса на русском языке', 'warning');
    return;
  }

  translating.value = true;
  try {
    const result = await translateText(formData.value.questionRaw, 'ru', 'en');
    if (result.translatedText) {
      formData.value.questionEn = result.translatedText;
      showToast('Перевод выполнен успешно', 'success');
    } else {
      showToast('Не удалось получить перевод. Попробуйте позже.', 'error');
    }
  } catch (error) {
    console.error('Ошибка перевода:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { status?: number } }).response;
      if (response?.status === 429) {
        showToast(
          'Сервис перевода временно недоступен из-за большого количества запросов. Пожалуйста, попробуйте позже.',
          'warning'
        );
        translating.value = false;
        return;
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    showToast('Ошибка перевода: ' + errorMessage, 'error');
  } finally {
    translating.value = false;
  }
};

const handleDelete = async () => {
  if (!editingQuestion.value || !props.question) {
    return;
  }

  const questionText = props.question.question?.substring(0, 50) || 'этот вопрос';
  const fullQuestionText = `${questionText}${props.question.question?.length > 50 ? '...' : ''}`;

  const { showConfirmDialog } = await import('../../composables/useConfirmDialog').then(m => m);
  showConfirmDialog(
    {
      message: `Вы уверены, что хотите удалить вопрос "${fullQuestionText}"?\n\nЭто действие нельзя отменить.`,
      title: 'Удаление вопроса',
      confirmType: 'danger',
    },
    async () => {
      deleting.value = true;
      try {
        await deleteQuestion(props.question?.id || '');
        emit('deleted', props.question?.id || '');
        showToast('Вопрос успешно удален', 'success');
        close();
      } catch (error) {
        console.error('Ошибка удаления вопроса:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        showToast('Ошибка удаления: ' + errorMessage, 'error');
      } finally {
        deleting.value = false;
      }
    }
  );
};
</script>

<style lang="scss" scoped>
@use '../../styles/modals' as *;
</style>
