<template>
  <!-- v-html используется для рендеринга доверенного markdown контента -->
  <div
    class="markdown-content"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
    v-html="highlightedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { useDictionaryHighlight } from '../composables/useDictionaryHighlight';

const props = defineProps({
  markdown: {
    type: String,
    required: true,
    default: '',
  },
});

defineEmits(['term-hover']);

const { highlightTermsInHTML } = useDictionaryHighlight();

// Настройка marked для подсветки синтаксиса
const highlightFunction = function (code: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch (err) {
      console.error('Ошибка подсветки синтаксиса:', err);
    }
  }
  return hljs.highlightAuto(code).value;
};

// Кастомный рендерер для блоков кода - добавляем класс hljs
const renderer = new marked.Renderer();
renderer.code = function (code: string, lang: string): string {
  const language = lang || '';
  const highlighted = highlightFunction(code, language);
  const classAttr = language ? ` class="language-${language} hljs"` : ' class="hljs"';
  return `<pre><code${classAttr}>${highlighted}</code></pre>`;
};

marked.use({
  renderer: renderer,
  breaks: true,
  gfm: true,
});

const htmlContent = computed(() => {
  if (!props.markdown || !props.markdown.trim()) {
    return '';
  }
  const result = marked.parse(props.markdown);
  // marked.parse может возвращать Promise в новых версиях, но синхронный вызов вернет string
  return typeof result === 'string' ? result : '';
});

const highlightedContent = computed(() => {
  const html = htmlContent.value;
  if (!html) return '';
  return highlightTermsInHTML(html);
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

// Словарь загружается глобально в App.vue
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;
.markdown-content {
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
    color: $text-dark;

    @media (max-width: $breakpoint-mobile) {
      font-size: 1.125rem;
      margin: 1.5rem 0 0.75rem 0;
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

  // Стили для инлайн кода (не в блоках)
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

  :deep(blockquote) {
    border-left: 4px solid $primary-color;
    padding-left: 1rem;
    margin: 1rem 0;
    color: $text-lighter-gray;
    font-style: italic;
  }

  :deep(table) {
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

  // Блоки кода внутри markdown (если есть)
  :deep(pre) {
    position: relative;
    background: $code-bg-dark !important;
    @include rounded-md;
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
    }
  }
}
</style>
