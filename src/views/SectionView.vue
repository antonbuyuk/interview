<template>
  <div class="section-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadContent">Повторить</button>
    </div>

    <div v-else class="section-wrapper">
      <div class="mobile-nav-wrapper">
        <Search :current-section="section" :questions="questions" />
      </div>

      <article
        ref="contentRef"
        class="content"
        :class="{ 'english-only': englishOnly }"
        @click="handleContentClick"
        v-html="htmlContent"
      ></article>

      <div class="right-sidebar">
        <Search :current-section="section" :questions="questions" />
        <div class="training-controls">
          <label class="toggle-label">
            <input v-model="englishOnly" type="checkbox" class="toggle-input" />
            <span class="toggle-slider"></span>
            <span class="toggle-text">English Only</span>
          </label>
          <label class="toggle-label">
            <input v-model="ttsEnabled" type="checkbox" class="toggle-input" />
            <span class="toggle-slider"></span>
            <span class="toggle-text">Text-to-Speech</span>
          </label>
          <div class="training-links">
            <router-link to="/training/flash-cards" class="training-link">
              🎴 Флэш-карточки
            </router-link>
            <router-link to="/training/practice" class="training-link"> ⏱️ Тренировка </router-link>
          </div>
        </div>
        <div v-if="isAdmin" class="question-management">
          <button class="add-question-btn" @click="openAddQuestion">➕ Добавить вопрос</button>
        </div>
        <QuestionNav :questions="questions" :is-admin="isAdmin" class="desktop-nav" />
      </div>
    </div>

    <!-- Модальное окно для добавления/редактирования вопросов -->
    <AddQuestionModal
      :is-open="showQuestionModal"
      :question="editingQuestion"
      :default-section-id="currentSectionId"
      :is-admin="isAdmin"
      @close="closeQuestionModal"
      @saved="handleQuestionSaved"
      @deleted="handleQuestionDeleted"
    />

    <!-- Модальное окно для вопросов на мобильных -->
    <div v-if="filterOpen" class="filter-overlay" @click="closeFilter">
      <div class="filter-modal" @click.stop>
        <div class="filter-modal-header">
          <h3>Навигация по вопросам</h3>
          <button class="filter-close-btn" aria-label="Закрыть" @click="closeFilter">×</button>
        </div>
        <div class="filter-modal-content">
          <QuestionNav :questions="questions" :is-admin="isAdmin" class="mobile-filter" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import hljs from 'highlight.js';
import QuestionNav from '../components/QuestionNav.vue';
import Search from '../components/Search.vue';
import AddQuestionModal from '../components/AddQuestionModal.vue';
import { useTrainingMode } from '../composables/useTrainingMode';
import { useAdminAuth } from '../composables/useAdminAuth';
import { getQuestions } from '../api/questions';
import { getSectionById } from '../api/sections';
// Используем темную тему и переопределим цвета для VS Code стиля
import 'highlight.js/styles/github-dark.css';
import '../styles/code.scss';
import '../styles/vscode-theme.scss';
import '../styles/highlight-fix.scss';

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const htmlContent = ref('');
const contentRef = ref(null);
const questions = ref([]);
const filterOpen = ref(false);
const fullQuestionsData = ref([]); // Полные данные вопросов для редактирования
const currentSectionId = ref(null); // UUID текущего раздела

// Модалка для добавления/редактирования вопросов
const showQuestionModal = ref(false);
const editingQuestion = ref(null);

// Training mode
const { englishOnly, ttsEnabled } = useTrainingMode();

// Admin auth
const { isAdmin } = useAdminAuth();

// Закрытие фильтра
const closeFilter = () => {
  filterOpen.value = false;
  const event = new CustomEvent('filter-closed');
  window.dispatchEvent(event);
};

// Обработчик открытия/закрытия фильтра
const handleToggleFilter = event => {
  filterOpen.value = event.detail.open;
};

// Методы для работы с модалкой вопросов
const openAddQuestion = async () => {
  editingQuestion.value = null;
  showQuestionModal.value = true;
  // Автоматически заполняем sectionId текущим разделом
  // Это будет обработано в модалке через prop
};

const openEditQuestion = question => {
  editingQuestion.value = question;
  showQuestionModal.value = true;
};

const closeQuestionModal = () => {
  showQuestionModal.value = false;
  editingQuestion.value = null;
};

const handleQuestionSaved = () => {
  // Перезагружаем контент после сохранения
  loadContent();
};

const handleQuestionDeleted = () => {
  // Перезагружаем контент после удаления
  loadContent();
};

// Передаем количество вопросов в Header через событие
watch(
  questions,
  newQuestions => {
    const event = new CustomEvent('questions-count-updated', {
      detail: { count: newQuestions.length },
    });
    window.dispatchEvent(event);
  },
  { immediate: true }
);

// Настройка marked для подсветки синтаксиса
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Ошибка подсветки синтаксиса:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// Генерация HTML из вопросов
const generateHtmlFromQuestions = questionsData => {
  let html = '';

  questionsData.forEach(q => {
    // Заголовок вопроса
    html += `<h3 id="question-${q.number}" data-question-id="${q.id}">${q.number}. ${q.questionRaw || q.question}</h3>\n\n`;

    // Блоки кода из вопроса (если есть)
    if (q.codeBlocks && Array.isArray(q.codeBlocks) && q.codeBlocks.length > 0) {
      q.codeBlocks.forEach(codeBlock => {
        const lang = codeBlock.language || '';
        html += `\`\`\`${lang}\n${codeBlock.code}\n\`\`\`\n\n`;
      });
    }

    // Ответы
    const answers = q.answers || [];

    const answerRu = answers.find(a => a.type === 'ru');
    const answerEn = answers.find(a => a.type === 'en');
    const answerSenior = answers.find(a => a.type === 'senior');

    if (answerRu) {
      html += `\n\n${answerRu.content}\n\n`;
    }

    if (answerEn) {
      html += `**Answer EN:**\n\n${answerEn.content}\n\n`;
    }

    if (answerSenior) {
      html += `**Ответ Senior:**\n\n${answerSenior.content}\n\n`;
    }

    html += '\n';
  });

  return html;
};

const loadContent = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Получаем раздел по sectionId для получения UUID
    const section = await getSectionById(props.section.id);
    currentSectionId.value = section.id;

    // Загружаем вопросы через API
    const questionsData = await getQuestions(section.id);

    // Сохраняем полные данные вопросов для редактирования
    fullQuestionsData.value = questionsData;

    // Извлекаем вопросы для навигации
    questions.value = questionsData.map(q => ({
      id: `question-${q.number}`,
      text: q.question,
    }));

    // Генерируем Markdown из вопросов
    const markdown = generateHtmlFromQuestions(questionsData);

    // Парсим Markdown в HTML
    let parsedHtml = marked.parse(markdown);

    // Оборачиваем ответы в аккордеоны
    parsedHtml = wrapAnswersInAccordions(parsedHtml);

    // Добавляем кнопки редактирования к заголовкам вопросов
    parsedHtml = addEditButtonsToQuestions(parsedHtml);

    htmlContent.value = parsedHtml;

    // Добавляем кнопки копирования и якоря после рендеринга DOM
    await nextTick();
    setTimeout(() => {
      addCopyButtons();
      addQuestionAnchors();
      initAccordions();
      // Применяем подсветку после создания аккордеонов
      ensureHighlightClasses();
      // Повторно применяем через небольшую задержку для аккордеонов
      setTimeout(() => {
        ensureHighlightClasses();
      }, 100);
    }, 150);
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки контента';
    console.error('Ошибка загрузки контента:', err);
  } finally {
    loading.value = false;
  }
};

// Слушаем события от Header для открытия/закрытия фильтра
onMounted(() => {
  window.addEventListener('toggle-filter', handleToggleFilter);
});

onUnmounted(() => {
  window.removeEventListener('toggle-filter', handleToggleFilter);
});

watch(
  () => props.section.id,
  () => {
    loadContent();
  },
  { immediate: true }
);

// Обработчик клика для контента (копирование кода и редактирование вопросов)
const handleContentClick = event => {
  // Обработка кнопки редактирования вопроса
  const editBtn = event.target.closest('.edit-question-btn');
  if (editBtn) {
    const questionId = editBtn.getAttribute('data-question-id');
    if (questionId) {
      const question = fullQuestionsData.value.find(q => q.id === questionId);
      if (question) {
        openEditQuestion(question);
      }
    }
    return;
  }

  // Обработка кнопки копирования кода
  const copyBtn = event.target.closest('.copy-code-btn');
  if (copyBtn) {
    const codeBlock = copyBtn.closest('pre');
    if (codeBlock) {
      const code = codeBlock.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent || code.innerText);
        copyBtn.textContent = '✓ Скопировано';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '📋';
          copyBtn.classList.remove('copied');
        }, 2000);
      }
    }
  }
};

// Убеждаемся, что классы highlight.js применены
const ensureHighlightClasses = () => {
  if (!contentRef.value) return;

  // Находим все блоки кода, включая внутри аккордеонов (даже скрытых)
  const codeBlocks = contentRef.value.querySelectorAll('pre code');

  codeBlocks.forEach(block => {
    // Проверяем, есть ли уже подсветка (есть ли элементы с классами hljs-*)
    const hasHighlight = block.querySelector(
      '.hljs-keyword, .hljs-string, .hljs-comment, .hljs-number, .hljs-function'
    );

    // Получаем исходный текст для подсветки
    const originalText = block.textContent || block.innerText;

    if (!hasHighlight && originalText && originalText.trim()) {
      // Если подсветки нет, применяем её
      try {
        // Определяем язык из класса родительского элемента или самого code
        let language = null;

        // Проверяем классы на code элементе
        const codeClassMatch = block.className.match(/language-(\w+)/);
        if (codeClassMatch) {
          language = codeClassMatch[1];
        } else {
          // Проверяем классы на pre элементе
          const pre = block.closest('pre');
          if (pre) {
            const preClassMatch = pre.className.match(/language-(\w+)/);
            if (preClassMatch) {
              language = preClassMatch[1];
            }
          }
        }

        // Если язык не найден, пробуем автоматическое определение
        if (!language || !hljs.getLanguage(language)) {
          const highlighted = hljs.highlightAuto(originalText);
          block.innerHTML = highlighted.value;
          block.classList.add('hljs');
          // Сохраняем определенный язык
          if (highlighted.language) {
            block.classList.add(`language-${highlighted.language}`);
          }
        } else {
          const highlighted = hljs.highlight(originalText, { language });
          block.innerHTML = highlighted.value;
          block.classList.add('hljs');
          block.classList.add(`language-${language}`);
        }
      } catch (e) {
        console.warn('Ошибка подсветки кода:', e, block);
        // Если не удалось подсветить, хотя бы добавим класс и базовые стили
        if (!block.classList.contains('hljs')) {
          block.classList.add('hljs');
        }
      }
    } else if (!block.classList.contains('hljs')) {
      // Если подсветка есть в HTML, но нет класса hljs - добавляем
      block.classList.add('hljs');
    }

    // Убеждаемся, что у pre есть правильный фон
    const pre = block.closest('pre');
    if (pre && !pre.style.backgroundColor) {
      pre.style.backgroundColor = '#1e1e1e';
    }
  });

  // Дополнительно применяем highlightAll для любых пропущенных блоков
  // Это важно для блоков, которые могли быть пропущены
  try {
    // Применяем highlightAll только к блокам без подсветки
    const unhighlighted = contentRef.value.querySelectorAll('pre code:not(.hljs)');
    unhighlighted.forEach(block => {
      if (block.textContent && block.textContent.trim()) {
        try {
          hljs.highlightElement(block);
        } catch (error) {
          console.error('Ошибка highlightElement:', error);
        }
      }
    });
  } catch (error) {
    console.error('Ошибка highlightAll:', error);
  }
};

// Добавление кнопок редактирования к заголовкам вопросов
const addEditButtonsToQuestions = html => {
  // Не добавляем кнопки, если пользователь не администратор
  if (!isAdmin.value) {
    return html;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const questionHeaders = tempDiv.querySelectorAll('h3[data-question-id]');
  questionHeaders.forEach(header => {
    // Проверяем, нет ли уже кнопки редактирования
    if (header.querySelector('.edit-question-btn')) return;

    const questionId = header.getAttribute('data-question-id');
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-question-btn';
    editBtn.setAttribute('data-question-id', questionId);
    editBtn.title = 'Редактировать вопрос';
    editBtn.innerHTML = '✏️';
    editBtn.type = 'button';

    // Добавляем обертку для заголовка, если её нет
    if (!header.classList.contains('question-header')) {
      header.classList.add('question-header');
    }

    header.appendChild(editBtn);
  });

  return tempDiv.innerHTML;
};

// Добавление кнопок копирования к блокам кода
const addCopyButtons = () => {
  if (!contentRef.value) return;
  const codeBlocks = contentRef.value.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    const pre = block.parentElement;
    if (pre && !pre.querySelector('.copy-code-btn')) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = '📋';
      copyBtn.title = 'Копировать код';
      pre.style.position = 'relative';
      pre.appendChild(copyBtn);
    }
  });
};

// Извлечение вопросов из markdown
// Функция extractQuestions больше не нужна, так как вопросы загружаются через API

// Добавление ID к вопросам (h3) для навигации
const addQuestionAnchors = () => {
  if (!contentRef.value) return;
  const h3Elements = contentRef.value.querySelectorAll('h3');
  let questionIndex = 1;

  h3Elements.forEach(h3 => {
    const text = h3.textContent || '';
    // Проверяем, что это вопрос (начинается с числа и точки)
    if (/^\d+\.\s+/.test(text.trim())) {
      h3.id = `question-${questionIndex}`;
      h3.style.scrollMarginTop = '120px';
      questionIndex++;
    }
  });
};

watch(htmlContent, async () => {
  if (htmlContent.value && contentRef.value) {
    await nextTick();
    setTimeout(() => {
      addCopyButtons();
      addQuestionAnchors();
      initAccordions();
      // Применяем подсветку после создания аккордеонов
      ensureHighlightClasses();
      // Повторно применяем через небольшую задержку для аккордеонов
      setTimeout(() => {
        ensureHighlightClasses();
      }, 100);
      // Альтернативное извлечение вопросов из HTML, если они не были извлечены из markdown
      if (questions.value.length === 0) {
        extractQuestionsFromHTML();
      }

      // Прокручиваем к вопросу, если он указан в hash
      if (route.hash) {
        const questionId = route.hash.substring(1);
        if (questionId) {
          scrollToQuestion(questionId);
        }
      }
    }, 150);
  }
});

// Функция для прокрутки к вопросу
const scrollToQuestion = questionId => {
  const attemptScroll = () => {
    const element = document.getElementById(questionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      return true;
    }
    return false;
  };

  // Пробуем сразу
  if (attemptScroll()) return;

  // Если не получилось, пробуем через небольшие интервалы
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    if (attemptScroll() || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);
};

// Следим за изменением hash
watch(
  () => route.hash,
  newHash => {
    if (newHash && htmlContent.value) {
      const questionId = newHash.substring(1);
      if (questionId) {
        nextTick(() => {
          setTimeout(() => {
            scrollToQuestion(questionId);
          }, 200);
        });
      }
    }
  }
);

// Альтернативный способ извлечения вопросов из HTML
const extractQuestionsFromHTML = () => {
  if (!contentRef.value) return;
  const h3Elements = contentRef.value.querySelectorAll('h3');
  const extractedQuestions = [];

  h3Elements.forEach((h3, index) => {
    const text = h3.textContent || '';
    // Проверяем, что это вопрос (начинается с числа и точки)
    if (/^\d+\.\s+/.test(text.trim())) {
      const cleanText = text
        .trim()
        .replace(/^\d+\.\s+/, '')
        .trim();
      extractedQuestions.push({
        id: `question-${index + 1}`,
        text: cleanText,
      });
    }
  });

  if (extractedQuestions.length > 0) {
    questions.value = extractedQuestions;
  }
};

// Проверка, является ли элемент маркером senior ответа
const isSeniorMarker = element => {
  const text = (element.textContent || '').toLowerCase().trim();
  const html = (element.innerHTML || '').toLowerCase();

  // Проверяем различные варианты маркеров
  const seniorPatterns = [
    /ответ\s+senior/i,
    /senior\s+ответ/i,
    /сеньор/i,
    /ответ\s+сеньор/i,
    /сеньор\s+ответ/i,
    /^\*\*ответ\s+senior/i,
    /^\*\*senior/i,
  ];

  // Проверяем текст элемента
  for (const pattern of seniorPatterns) {
    if (pattern.test(text) || pattern.test(html)) {
      return true;
    }
  }

  // Проверяем жирный текст (strong)
  if (element.tagName === 'STRONG' || element.tagName === 'B') {
    for (const pattern of seniorPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  // Проверяем заголовки
  if (['H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
    for (const pattern of seniorPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  return false;
};

// Проверка, является ли элемент маркером английского ответа
const isAnswerEnMarker = element => {
  const text = (element.textContent || '').toLowerCase().trim();
  const html = (element.innerHTML || '').toLowerCase();

  // Проверяем различные варианты маркеров
  const answerEnPatterns = [/answer\s+en/i, /^\*\*answer\s+en:\*\*/i, /answer\s+en:/i];

  // Проверяем текст элемента
  for (const pattern of answerEnPatterns) {
    if (pattern.test(text) || pattern.test(html)) {
      return true;
    }
  }

  // Проверяем жирный текст (strong)
  if (element.tagName === 'STRONG' || element.tagName === 'B') {
    for (const pattern of answerEnPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  // Проверяем заголовки
  if (['H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
    for (const pattern of answerEnPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  return false;
};

// Проверка, содержит ли элемент русский текст в жирном формате (новый русский раздел)
const isRussianSectionMarker = element => {
  // Проверяем жирный текст (strong/b) на наличие кириллицы
  const strongElements = element.querySelectorAll('strong, b');
  for (const strong of strongElements) {
    const text = strong.textContent || '';
    // Проверяем наличие кириллицы
    if (/[а-яё]/i.test(text)) {
      // Исключаем маркеры "Ответ", "Ответ Senior"
      const lowerText = text.toLowerCase();
      if (!lowerText.includes('ответ') && !lowerText.includes('answer en')) {
        return true;
      }
    }
  }

  // Также проверяем сам элемент, если это strong/b
  if (element.tagName === 'STRONG' || element.tagName === 'B') {
    const text = element.textContent || '';
    if (/[а-яё]/i.test(text)) {
      const lowerText = text.toLowerCase();
      if (!lowerText.includes('ответ') && !lowerText.includes('answer en')) {
        return true;
      }
    }
  }

  return false;
};

// Оборачивание ответов в аккордеоны
const wrapAnswersInAccordions = html => {
  // Создаем временный контейнер для работы с DOM
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Находим все h3 элементы (вопросы)
  const h3Elements = Array.from(tempDiv.querySelectorAll('h3'));

  // Обрабатываем каждый вопрос
  h3Elements.forEach(h3 => {
    const text = h3.textContent || '';
    // Проверяем, что это вопрос (начинается с числа и точки)
    if (!/^\d+\.\s+/.test(text.trim())) return;

    // Находим все элементы после h3 до следующего h3 или конца
    const allElements = [];
    let currentElement = h3.nextElementSibling;

    while (currentElement) {
      // Если встретили следующий вопрос, останавливаемся
      if (
        currentElement.tagName === 'H3' &&
        /^\d+\.\s+/.test((currentElement.textContent || '').trim())
      ) {
        break;
      }

      allElements.push(currentElement);
      currentElement = currentElement.nextElementSibling;
    }

    if (allElements.length === 0) return;

    // Ищем маркеры Answer EN и senior ответа
    let answerEnMarkerIndex = -1;
    let seniorMarkerIndex = -1;

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];

      // Проверяем маркер Answer EN
      if (answerEnMarkerIndex === -1) {
        // Проверяем сам элемент
        if (isAnswerEnMarker(el)) {
          answerEnMarkerIndex = i;
        } else {
          // Проверяем содержимое элемента (для параграфов)
          const innerElements = el.querySelectorAll('strong, b, h3, h4, h5, h6, p');
          for (const innerEl of innerElements) {
            if (isAnswerEnMarker(innerEl)) {
              answerEnMarkerIndex = i;
              break;
            }
          }

          // Проверяем текст элемента напрямую (для случаев, когда маркер в начале параграфа)
          if (answerEnMarkerIndex === -1) {
            const text = (el.textContent || '').toLowerCase().trim();
            const html = (el.innerHTML || '').toLowerCase();

            // Проверяем различные варианты
            if (
              text.includes('answer en:') ||
              text.startsWith('answer en:') ||
              /answer\s+en:/i.test(text) ||
              html.includes('answer en:') ||
              /<strong>answer\s+en:<\/strong>/i.test(html)
            ) {
              answerEnMarkerIndex = i;
            }
          }
        }
      }

      // Проверяем маркер senior ответа
      if (seniorMarkerIndex === -1) {
        if (isSeniorMarker(el)) {
          seniorMarkerIndex = i;
        } else {
          // Проверяем содержимое элемента
          const innerElements = el.querySelectorAll('strong, b, h3, h4, h5, h6, p');
          for (const innerEl of innerElements) {
            if (isSeniorMarker(innerEl)) {
              seniorMarkerIndex = i;
              break;
            }
          }

          // Проверяем текст элемента напрямую
          if (seniorMarkerIndex === -1) {
            const text = (el.textContent || '').toLowerCase().trim();
            if (
              text.includes('ответ senior') ||
              text.includes('senior ответ') ||
              text.includes('ответ сеньор') ||
              text.includes('сеньор ответ') ||
              /^\*\*ответ\s+senior/i.test(text) ||
              /^\*\*senior/i.test(text)
            ) {
              seniorMarkerIndex = i;
            }
          }
        }
      }

      // Если нашли оба маркера, можно прервать поиск
      if (answerEnMarkerIndex >= 0 && seniorMarkerIndex >= 0) break;
    }

    // Определяем конец обычного ответа (минимум из двух маркеров, если они найдены)
    let regularAnswerEndIndex = allElements.length;
    if (answerEnMarkerIndex >= 0) {
      regularAnswerEndIndex = Math.min(regularAnswerEndIndex, answerEnMarkerIndex);
    }
    if (seniorMarkerIndex >= 0) {
      regularAnswerEndIndex = Math.min(regularAnswerEndIndex, seniorMarkerIndex);
    }

    // Разделяем элементы на обычный ответ, Answer EN и senior ответ
    const regularAnswerElements = allElements.slice(0, regularAnswerEndIndex);

    // Находим элементы для блока Answer EN
    let answerEnElements = [];
    if (answerEnMarkerIndex >= 0) {
      // Блок Answer EN начинается с маркера и заканчивается перед русским разделом, "Ответ Senior:" или перед следующим вопросом
      let answerEnEndIndex = allElements.length;

      // Если есть senior маркер после Answer EN, блок Answer EN заканчивается перед ним
      if (seniorMarkerIndex >= 0 && seniorMarkerIndex > answerEnMarkerIndex) {
        answerEnEndIndex = seniorMarkerIndex;
      } else {
        // Ищем, где заканчивается блок Answer EN
        for (let i = answerEnMarkerIndex + 1; i < allElements.length; i++) {
          const el = allElements[i];
          const text = (el.textContent || '').toLowerCase().trim();

          // Если это следующий вопрос, останавливаемся
          if (el.tagName === 'H3' && /^\d+\.\s+/.test(text)) {
            answerEnEndIndex = i;
            break;
          }

          // Если это маркер senior (на случай, если он не был найден ранее)
          if (isSeniorMarker(el)) {
            answerEnEndIndex = i;
            break;
          }

          // Если это русский раздел (например, "Преимущества:"), останавливаемся
          if (isRussianSectionMarker(el)) {
            answerEnEndIndex = i;
            break;
          }
        }
      }

      answerEnElements = allElements.slice(answerEnMarkerIndex, answerEnEndIndex);

      // Добавляем русские разделы после Answer EN в обычный ответ
      // (элементы от конца Answer EN до начала Senior ответа)
      // ВАЖНО: Если Senior маркер найден, НЕ добавляем элементы между Answer EN и Senior к обычному ответу,
      // так как они могут быть частью Senior ответа
      if (answerEnEndIndex < allElements.length && seniorMarkerIndex === -1) {
        // Если маркер Senior не был найден ранее, ищем его в элементах после Answer EN
        for (let i = answerEnEndIndex; i < allElements.length; i++) {
          const el = allElements[i];
          if (isSeniorMarker(el)) {
            seniorMarkerIndex = i;
            break;
          }
          // Проверяем содержимое элемента
          const innerElements = el.querySelectorAll('strong, b, h3, h4, h5, h6, p');
          for (const innerEl of innerElements) {
            if (isSeniorMarker(innerEl)) {
              seniorMarkerIndex = i;
              break;
            }
          }
          // Проверяем текст элемента напрямую
          if (seniorMarkerIndex === -1) {
            const text = (el.textContent || '').toLowerCase().trim();
            if (
              text.includes('ответ senior') ||
              text.includes('senior ответ') ||
              text.includes('ответ сеньор') ||
              text.includes('сеньор ответ') ||
              /^\*\*ответ\s+senior/i.test(text) ||
              /^\*\*senior/i.test(text)
            ) {
              seniorMarkerIndex = i;
              break;
            }
          }
          if (seniorMarkerIndex >= 0) break;
        }

        // Если Senior маркер все еще не найден, добавляем русские разделы к обычному ответу
        if (seniorMarkerIndex === -1) {
          const russianSections = allElements.slice(answerEnEndIndex);
          regularAnswerElements.push(...russianSections);
        }
      }
    }

    // Для senior ответа: начинаем с маркера senior
    let seniorAnswerElements = [];
    if (seniorMarkerIndex >= 0) {
      seniorAnswerElements = allElements.slice(seniorMarkerIndex);
    }

    // Создаем аккордеон для обычного ответа
    if (regularAnswerElements.length > 0) {
      const regularAccordion = createAccordion('Показать ответ', regularAnswerElements);
      h3.insertAdjacentElement('afterend', regularAccordion);
    }

    // Создаем аккордеон для Answer EN (если есть)
    if (answerEnElements.length > 0) {
      const answerEnContentElements = [];
      const firstElement = answerEnElements[0];

      // Проверяем, содержит ли первый элемент только маркер или еще и текст
      if (firstElement) {
        const fullText = firstElement.textContent || '';
        const markerMatch = fullText.match(/answer\s+en:\s*(.+)/i);

        if (markerMatch && markerMatch[1] && markerMatch[1].trim()) {
          // Есть текст после маркера - создаем новый элемент с этим текстом
          const textAfterMarker = markerMatch[1].trim();
          const newP = document.createElement('p');
          newP.textContent = textAfterMarker;
          answerEnContentElements.push(newP);
        } else {
          // Нет текста после маркера в первом элементе - проверяем, есть ли другие элементы
          // Если первый элемент содержит только маркер, пропускаем его
          const hasOnlyMarker =
            isAnswerEnMarker(firstElement) ||
            (firstElement.querySelector('strong, b') &&
              !fullText.replace(/answer\s+en:\s*/i, '').trim());

          if (!hasOnlyMarker) {
            // В элементе есть другой контент, добавляем его (без маркера)
            const cloned = firstElement.cloneNode(true);
            const strongElements = cloned.querySelectorAll('strong, b');
            strongElements.forEach(strong => {
              const text = (strong.textContent || '').toLowerCase().trim();
              if (text.includes('answer en')) {
                strong.remove();
              }
            });
            if (cloned.textContent && cloned.textContent.trim()) {
              answerEnContentElements.push(cloned);
            }
          }
        }
      }

      // Добавляем остальные элементы (начиная со второго, если первый был только маркером)
      const startIndex =
        firstElement && (firstElement.textContent || '').match(/answer\s+en:\s*$/i) ? 1 : 1;
      for (let i = startIndex; i < answerEnElements.length; i++) {
        answerEnContentElements.push(answerEnElements[i].cloneNode(true));
      }

      if (answerEnContentElements.length > 0) {
        const answerEnAccordion = createAccordion('Answer EN', answerEnContentElements, false);
        // Вставляем после обычного аккордеона или после вопроса
        const insertAfter = regularAnswerElements.length > 0 ? h3.nextElementSibling : h3;
        answerEnAccordion.setAttribute('data-type', 'answer-en');
        insertAfter.insertAdjacentElement('afterend', answerEnAccordion);
      }
    }

    // Создаем аккордеон для senior ответа
    if (seniorAnswerElements.length > 0) {
      // Исключаем маркер из содержимого
      const seniorContentElements = seniorAnswerElements.slice(1); // Пропускаем первый элемент (маркер)
      if (seniorContentElements.length > 0) {
        const seniorAccordion = createAccordion('Ответ senior', seniorContentElements, true);
        // Вставляем после Answer EN аккордеона, обычного аккордеона или после вопроса
        let insertAfter = h3;
        if (answerEnElements.length > 0) {
          // Ищем последний аккордеон (Answer EN)
          const lastAccordion = h3.nextElementSibling;
          if (lastAccordion) {
            insertAfter = lastAccordion;
          }
        } else if (regularAnswerElements.length > 0) {
          insertAfter = h3.nextElementSibling;
        }
        insertAfter.insertAdjacentElement('afterend', seniorAccordion);
      }
    }

    // Удаляем оригинальные элементы (в обратном порядке)
    allElements.reverse().forEach(el => {
      if (el.parentNode) {
        el.remove();
      }
    });
  });

  return tempDiv.innerHTML;
};

// Создание аккордеона с заданным заголовком и элементами
const createAccordion = (label, elements, isSenior = false) => {
  const accordionWrapper = document.createElement('div');
  accordionWrapper.className = 'answer-accordion';
  if (isSenior) {
    accordionWrapper.setAttribute('data-type', 'senior');
  }

  const accordionToggle = document.createElement('button');
  accordionToggle.className = 'answer-accordion-toggle';
  accordionToggle.type = 'button';
  accordionToggle.innerHTML = `
    <span class="answer-accordion-icon">▶</span>
    <span class="answer-accordion-label">${label}</span>
  `;

  const accordionContent = document.createElement('div');
  accordionContent.className = 'answer-accordion-content';

  const accordionInner = document.createElement('div');
  accordionInner.className = 'answer-accordion-inner';

  // Клонируем и добавляем все элементы внутрь аккордеона
  elements.forEach(el => {
    // Используем cloneNode(true) для глубокого клонирования со всем HTML
    const cloned = el.cloneNode(true);

    // Убеждаемся, что код внутри сохраняет подсветку
    const codeBlocks = cloned.querySelectorAll('pre code');
    codeBlocks.forEach(codeBlock => {
      // Проверяем, есть ли уже подсветка
      const hasHighlight = codeBlock.querySelector(
        '.hljs-keyword, .hljs-string, .hljs-comment, .hljs-number, .hljs-function'
      );

      if (!hasHighlight) {
        // Получаем исходный текст
        const originalText = codeBlock.textContent || codeBlock.innerText;

        if (originalText && originalText.trim()) {
          try {
            // Определяем язык
            let language = codeBlock.className.match(/language-(\w+)/)?.[1];
            if (!language) {
              const pre = codeBlock.closest('pre');
              if (pre) {
                language = pre.className.match(/language-(\w+)/)?.[1];
              }
            }

            if (language && hljs.getLanguage(language)) {
              const highlighted = hljs.highlight(originalText, { language });
              codeBlock.innerHTML = highlighted.value;
              codeBlock.classList.add('hljs');
              if (!codeBlock.classList.contains(`language-${language}`)) {
                codeBlock.classList.add(`language-${language}`);
              }
            } else {
              // Автоматическое определение
              const highlighted = hljs.highlightAuto(originalText);
              codeBlock.innerHTML = highlighted.value;
              codeBlock.classList.add('hljs');
              if (highlighted.language) {
                codeBlock.classList.add(`language-${highlighted.language}`);
              }
            }
          } catch (e) {
            console.warn('Ошибка подсветки при создании аккордеона:', e);
          }
        }
      } else {
        // Если подсветка уже есть, убеждаемся что есть класс hljs
        if (!codeBlock.classList.contains('hljs')) {
          codeBlock.classList.add('hljs');
        }
      }

      // Убеждаемся, что у pre есть правильный фон
      const pre = codeBlock.closest('pre');
      if (pre) {
        pre.style.backgroundColor = '#1e1e1e';
      }
    });

    accordionInner.appendChild(cloned);
  });

  accordionContent.appendChild(accordionInner);
  accordionWrapper.appendChild(accordionToggle);
  accordionWrapper.appendChild(accordionContent);

  return accordionWrapper;
};

// Инициализация аккордеонов после рендеринга
const initAccordions = () => {
  if (!contentRef.value) return;

  const accordionToggles = contentRef.value.querySelectorAll('.answer-accordion-toggle');

  accordionToggles.forEach(toggle => {
    // Убираем старый обработчик, если есть
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    // Добавляем обработчик клика
    newToggle.addEventListener('click', () => {
      const accordion = newToggle.closest('.answer-accordion');
      const content = accordion?.querySelector('.answer-accordion-content');
      const icon = newToggle.querySelector('.answer-accordion-icon');

      if (accordion && content && icon) {
        const isOpen = accordion.classList.toggle('open');
        const inner = content.querySelector('.answer-accordion-inner');

        if (isOpen) {
          icon.textContent = '▼';
          if (inner) {
            content.style.maxHeight = inner.scrollHeight + 'px';

            // Применяем подсветку к коду внутри аккордеона при раскрытии
            setTimeout(() => {
              const codeBlocks = inner.querySelectorAll('pre code');
              codeBlocks.forEach(block => {
                const hasHighlight = block.querySelector(
                  '.hljs-keyword, .hljs-string, .hljs-comment, .hljs-number, .hljs-function'
                );
                if (!hasHighlight && block.textContent) {
                  try {
                    const language =
                      block.className.match(/language-(\w+)/)?.[1] ||
                      block.getAttribute('data-lang') ||
                      'javascript';

                    if (hljs.getLanguage(language)) {
                      const highlighted = hljs.highlight(block.textContent, { language });
                      block.innerHTML = highlighted.value;
                      block.classList.add('hljs');
                    } else {
                      const highlighted = hljs.highlightAuto(block.textContent);
                      block.innerHTML = highlighted.value;
                      block.classList.add('hljs');
                    }
                  } catch (e) {
                    console.warn('Ошибка подсветки кода в аккордеоне:', e);
                  }
                }
              });

              // Добавляем кнопки копирования, если их нет
              const preBlocks = inner.querySelectorAll('pre');
              preBlocks.forEach(pre => {
                if (!pre.querySelector('.copy-code-btn')) {
                  const copyBtn = document.createElement('button');
                  copyBtn.className = 'copy-code-btn';
                  copyBtn.textContent = '📋';
                  copyBtn.title = 'Копировать код';
                  pre.style.position = 'relative';
                  pre.appendChild(copyBtn);
                }
              });
            }, 50);
          }
        } else {
          icon.textContent = '▶';
          content.style.maxHeight = '0';
        }
      }
    });
  });
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.section-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  overflow: visible;

  @media (max-width: $breakpoint-mobile) {
    padding: 0;
  }
}

.section-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
  position: relative;

  @media (max-width: $breakpoint-tablet) {
    grid-template-columns: 1fr;
  }

  @media (max-width: $breakpoint-mobile) {
    display: flex;
    flex-direction: column;
  }
}

.mobile-nav-wrapper {
  display: none;

  @media (max-width: $breakpoint-mobile) {
    display: block;
    padding: 1rem;
    background: $bg-white;
    border-bottom: 1px solid $border-color;
    width: 100%;
  }
}

.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: sticky;
  top: 2rem;
  align-self: start;

  @media (max-width: $breakpoint-tablet) {
    position: relative;
    top: 0;
    margin-top: 2rem;
  }

  @media (max-width: $breakpoint-mobile) {
    display: none;

    .desktop-nav {
      display: none;
    }
  }
}

.training-controls {
  background: $bg-white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid $border-color;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: $breakpoint-mobile) {
    display: none;
  }
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  margin-bottom: 0.75rem;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  transition: background 0.3s ease;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: 3px;
    transition: transform 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.toggle-input:checked + .toggle-slider {
  background: $primary-color;

  &::before {
    transform: translateX(20px);
  }
}

.toggle-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-gray;
}

.training-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid $border-color;
}

.training-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 6px;
  color: $text-gray;
  text-decoration: none;
  font-size: 0.8125rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e9ecef;
    border-color: $primary-color;
    color: $primary-color;
  }
}

.question-management {
  background: $bg-white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid $border-color;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;

  @media (max-width: $breakpoint-mobile) {
    display: none;
  }
}

.add-question-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: $primary-hover;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(66, 184, 131, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #c33;

  h2 {
    margin-bottom: 0.5rem;
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover {
    background: $primary-hover;
  }
}

.content {
  background: $bg-white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.8;

  @media (max-width: $breakpoint-mobile) {
    max-width: 100%;
    padding: 1rem;
    border-radius: 0;
    font-size: 0.9375rem;
  }

  // Стили для markdown контента
  :deep(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid $border-color;
    color: $text-dark;

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  }

  :deep(h2) {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 2rem 0 1rem 0;
    color: $text-dark;

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.25rem;
      margin: 1.5rem 0 0.75rem 0;
    }
  }

  :deep(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 2rem 0 1rem 0;
    padding-top: 1rem;
    padding-bottom: 0.5rem;
    color: $primary-color;
    line-height: 1.5;
    scroll-margin-top: 120px;

    &[id] {
      position: relative;

      &::before {
        content: '';
        display: block;
        height: 120px;
        margin-top: -120px;
        visibility: hidden;
      }
    }

    &.question-header {
      position: relative;
    }

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.125rem;
      margin: 1.5rem 0 0.75rem 0;
      padding-top: 0.75rem;
    }
  }

  :deep(.edit-question-btn) {
    background: rgba(66, 184, 131, 0.1);
    border: 1px solid rgba(66, 184, 131, 0.3);
    border-radius: 6px;
    padding: 0.375rem 0.625rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
    opacity: 0.7;
    position: absolute;
    right: 0;

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

  :deep(h4) {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: $text-dark;
  }

  :deep(p) {
    margin: 1rem 0;
    line-height: 1.8;
    color: $text-gray;

    &:first-of-type {
      margin-top: 0;
    }

    @media (max-width: $breakpoint-mobile) {
      margin: 0.75rem 0;
      line-height: 1.7;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: 1rem 0;
    padding-left: 2rem;
    line-height: 1.8;

    @media (max-width: $breakpoint-mobile) {
      padding-left: 1.5rem;
      margin: 0.75rem 0;
    }
  }

  :deep(li) {
    margin: 0.75rem 0;
    line-height: 1.8;
    color: $text-gray;

    &::marker {
      color: $primary-color;
      font-weight: 600;
    }

    @media (max-width: $breakpoint-mobile) {
      margin: 0.5rem 0;
    }
  }

  :deep(strong) {
    font-weight: 700;
    color: $text-dark;
  }

  :deep(em) {
    font-style: italic;
    color: $text-light-gray;
  }

  // Стили только для инлайн кода (не в блоках)
  :deep(p code),
  :deep(li code),
  :deep(td code),
  :deep(strong code),
  :deep(em code) {
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-family: $mono-font;
    font-size: 0.9em;
    color: $code-pink;
    font-weight: 500;
    border: 1px solid rgba(232, 62, 140, 0.2);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  // Убираем стили инлайн кода для блоков
  :deep(pre) {
    position: relative;
    background: $code-bg-dark !important;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    padding-top: 2.75rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    font-size: 0.875rem;
    line-height: 1.5;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.15);
    }

    // Убеждаемся, что все элементы внутри pre используют правильные стили
    * {
      color: inherit;
    }

    // Красивый скроллбар для блоков кода
    &::-webkit-scrollbar {
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 10px;
      margin: 0.5rem 0;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      border: 2px solid $code-bg-dark;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    @media (max-width: $breakpoint-mobile) {
      padding: 1rem;
      padding-top: 2.5rem;
      font-size: 0.8125rem;
      margin: 1rem 0;
      border-radius: 6px;
    }

    code {
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      font-size: 0.875rem !important;
      line-height: 1.5 !important;
      font-family: $mono-font !important;
      font-variant-ligatures: common-ligatures;
      tab-size: 2;
      display: block;
      overflow-x: visible;
      white-space: pre;
      word-wrap: normal;
      overflow-wrap: normal;

      &.hljs {
        color: $code-text !important;
        background: transparent !important;
      }

      // Переопределяем все стили highlight.js для VS Code стиля
      &,
      * {
        font-family: $mono-font !important;
      }

      // Переопределяем цвета темы для лучшей читаемости
      .hljs-comment,
      .hljs-quote,
      &.hljs .hljs-comment,
      &.hljs .hljs-quote {
        color: #6a9955 !important;
        font-style: italic !important;
      }

      .hljs-keyword,
      .hljs-selector-tag,
      &.hljs .hljs-keyword,
      &.hljs .hljs-selector-tag {
        color: #569cd6 !important;
      }

      .hljs-string,
      .hljs-meta .hljs-meta-string,
      &.hljs .hljs-string,
      &.hljs .hljs-meta .hljs-meta-string {
        color: #ce9178 !important;
      }

      .hljs-number,
      .hljs-literal,
      &.hljs .hljs-number,
      &.hljs .hljs-literal {
        color: #b5cea8 !important;
      }

      .hljs-function,
      .hljs-title,
      .hljs-title.function_,
      &.hljs .hljs-function,
      &.hljs .hljs-title:not(.hljs-class):not(.hljs-type) {
        color: #dcdcaa !important;
      }

      .hljs-type,
      .hljs-class,
      &.hljs .hljs-type,
      &.hljs .hljs-class {
        color: #4ec9b0 !important;
      }

      .hljs-variable,
      .hljs-params,
      &.hljs .hljs-variable,
      &.hljs .hljs-params {
        color: #9cdcfe !important;
      }

      .hljs-property,
      .hljs-attr,
      &.hljs .hljs-property,
      &.hljs .hljs-attr {
        color: #92c5f7 !important;
      }

      .hljs-built_in,
      &.hljs .hljs-built_in {
        color: #569cd6 !important;
      }

      .hljs-regexp,
      &.hljs .hljs-regexp {
        color: #d16969 !important;
      }
    }
  }

  // Кнопка копирования кода
  :deep(.copy-code-btn) {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #abb2bf;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
    z-index: 10;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      transform: scale(1.05);
    }

    &.copied {
      background: rgba(98, 239, 152, 0.2);
      border-color: rgba(98, 239, 152, 0.4);
      color: #62ef98;
      font-size: 0.875rem;
    }

    @media (max-width: $breakpoint-mobile) {
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid $primary-color;
    padding-left: 1rem;
    margin: 1rem 0;
    color: $text-lighter-gray;
    font-style: italic;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;

    @media (max-width: $breakpoint-mobile) {
      font-size: 0.875rem;
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    th,
    td {
      border: 1px solid $border-color;
      padding: 0.75rem;
      text-align: left;

      @media (max-width: $breakpoint-mobile) {
        padding: 0.5rem;
        min-width: 100px;
      }
    }

    th {
      background: $bg-light;
      font-weight: 600;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid $border-color;
    margin: 2rem 0;
  }

  :deep(a) {
    color: $primary-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // Скрытие русских ответов в режиме English Only
  &.english-only {
    :deep(.answer-accordion:not([data-type='answer-en'])) {
      display: none !important;
    }
  }

  // Стили для аккордеонов с ответами
  :deep(.answer-accordion) {
    margin: 1rem 0 2rem 0;

    &[data-type='answer-en'] {
      margin-top: 1rem;

      .answer-accordion-toggle {
        background: $answer-en-bg;
        border-color: $answer-en-border;
        color: $answer-en-color;

        &:hover {
          background: #cce6ff;
          border-color: #3399ff;
          color: #0052a3;
        }

        .answer-accordion-icon {
          color: $answer-en-color;
        }
      }

      .answer-accordion-inner {
        border-top-color: $answer-en-border;
      }
    }

    &[data-type='senior'] {
      margin-top: 1rem;

      .answer-accordion-toggle {
        background: $senior-bg;
        border-color: $senior-border;
        color: $senior-color;

        &:hover {
          background: #ffe6cc;
          border-color: #ffb84d;
          color: #b35900;
        }

        .answer-accordion-icon {
          color: $senior-color;
        }
      }

      .answer-accordion-inner {
        border-top-color: $senior-border;
      }
    }

    &.open .answer-accordion-icon {
      transform: rotate(90deg);
    }
  }

  :deep(.answer-accordion-toggle) {
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

  :deep(.answer-accordion-icon) {
    display: inline-block;
    transition: transform 0.3s ease;
    color: $text-lighter-gray;
    font-size: 0.75rem;
  }

  :deep(.answer-accordion-label) {
    flex: 1;
    text-align: left;
  }

  :deep(.answer-accordion-content) {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.3s ease;
  }

  :deep(.answer-accordion-inner) {
    padding: 1rem 0;
    border-top: 1px solid #f0f0f0;
    margin-top: 0.5rem;
  }

  // Подсветка кода внутри аккордеонов
  :deep(.answer-accordion) {
    pre {
      background: $code-bg-dark !important;

      code,
      code.hljs {
        background: transparent !important;
        color: $code-text !important;
      }
    }

    .hljs-keyword {
      color: #569cd6 !important;
    }

    .hljs-string {
      color: #ce9178 !important;
    }

    .hljs-comment {
      color: #6a9955 !important;
      font-style: italic !important;
    }

    .hljs-number,
    .hljs-literal {
      color: #b5cea8 !important;
    }

    .hljs-function,
    .hljs-title:not(.hljs-class):not(.hljs-type) {
      color: #dcdcaa !important;
    }

    .hljs-type,
    .hljs-class {
      color: #4ec9b0 !important;
    }

    .hljs-variable,
    .hljs-params {
      color: #9cdcfe !important;
    }

    .hljs-property,
    .hljs-attr {
      color: #92c5f7 !important;
    }

    .hljs-built_in {
      color: #569cd6 !important;
    }

    .hljs-regexp {
      color: #d16969 !important;
    }
  }
}

// Модальное окно фильтра вопросов
.filter-overlay {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;

  @media (max-width: $breakpoint-mobile) {
    padding: 0.5rem;
  }
}

.filter-modal {
  background: $bg-white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 56px - 2rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  @media (max-width: $breakpoint-mobile) {
    max-height: calc(100vh - 56px - 1rem);
    border-radius: 8px;
  }
}

.filter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;

  @media (max-width: $breakpoint-mobile) {
    padding: 0.875rem 1rem;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: $text-dark;

    @media (max-width: $breakpoint-mobile) {
      font-size: 1rem;
    }
  }
}

.filter-close-btn {
  background: transparent;
  border: none;
  color: $text-lighter-gray;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: $border-color;
    color: $text-gray;
  }
}

.filter-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;

  @media (max-width: $breakpoint-mobile) {
    padding: 0.75rem;
  }
}

.question-nav.mobile-filter {
  position: relative !important;
  top: 0 !important;
  max-height: none;
  border: none;
  box-shadow: none;
  padding: 0;

  .question-list {
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }
}
</style>
