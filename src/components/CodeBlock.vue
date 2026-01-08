<template>
  <pre class="code-block">
    <code
      ref="codeRef"
      :class="[`language-${language}`, 'hljs']"
      v-html="highlightedCode"
    ></code>
    <button
      class="copy-code-btn"
      :class="{ copied: isCopied }"
      :title="isCopied ? 'Скопировано' : 'Копировать код'"
      @click="handleCopy"
    >
      <template v-if="isCopied">
        <CheckIcon class="icon-inline" />
        Скопировано
      </template>
      <ClipboardDocumentIcon v-else class="icon-inline" />
    </button>
  </pre>
</template>

<script setup>
import { ref, computed } from 'vue';
import hljs from 'highlight.js';

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: '',
  },
});

const codeRef = ref(null);
const isCopied = ref(false);

const highlightedCode = computed(() => {
  if (!props.code || !props.code.trim()) {
    return '';
  }

  try {
    const lang = props.language || '';

    if (lang && hljs.getLanguage(lang)) {
      const result = hljs.highlight(props.code, { language: lang });
      return result.value;
    } else {
      const result = hljs.highlightAuto(props.code);
      return result.value;
    }
  } catch (err) {
    console.error('Ошибка подсветки кода:', err);
    // Возвращаем экранированный код в случае ошибки
    return escapeHtml(props.code);
  }
});

const escapeHtml = text => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Ошибка копирования:', err);
    // Fallback для старых браузеров
    try {
      const textArea = document.createElement('textarea');
      textArea.value = props.code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false;
      }, 2000);
    } catch (fallbackErr) {
      console.error('Ошибка fallback копирования:', fallbackErr);
    }
  }
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.code-block {
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
    color: $code-text !important;

    &.hljs {
      color: $code-text !important;
      background: transparent !important;
    }

    // Переопределяем цвета темы для лучшей читаемости
    :deep(.hljs-comment),
    :deep(.hljs-quote) {
      color: #6a9955 !important;
      font-style: italic !important;
    }

    :deep(.hljs-keyword),
    :deep(.hljs-selector-tag) {
      color: #569cd6 !important;
    }

    :deep(.hljs-string),
    :deep(.hljs-meta .hljs-meta-string) {
      color: #ce9178 !important;
    }

    :deep(.hljs-number),
    :deep(.hljs-literal) {
      color: #b5cea8 !important;
    }

    :deep(.hljs-function),
    :deep(.hljs-title:not(.hljs-class):not(.hljs-type)) {
      color: #dcdcaa !important;
    }

    :deep(.hljs-type),
    :deep(.hljs-class) {
      color: #4ec9b0 !important;
    }

    :deep(.hljs-variable),
    :deep(.hljs-params) {
      color: #9cdcfe !important;
    }

    :deep(.hljs-property),
    :deep(.hljs-attr) {
      color: #92c5f7 !important;
    }

    :deep(.hljs-built_in) {
      color: #569cd6 !important;
    }

    :deep(.hljs-regexp) {
      color: #d16969 !important;
    }
  }
}

.copy-code-btn {
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
  display: flex;
  align-items: center;
  gap: 0.375rem;

  .icon-inline {
    width: 1rem;
    height: 1rem;
    color: inherit;
    flex-shrink: 0;
  }

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

    .icon-inline {
      width: 0.875rem;
      height: 0.875rem;
    }
  }
}
</style>
