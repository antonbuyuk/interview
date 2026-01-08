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

<script setup lang="ts">
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
@use '../styles/mixins' as *;

.code-block {
  position: relative;
  background: $code-bg-dark !important;
  @include rounded-md;
  padding: 1.25rem 1.5rem;
  padding-top: 2.75rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: $shadow-md;
  border: 1px solid $border-color;
  @include transition(all, 0.3s, ease);
  font-size: 0.875rem;
  line-height: 1.5;

  &:hover {
    box-shadow: $shadow-lg;
    border-color: $border-color;
  }

  // Красивый скроллбар для блоков кода
  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: $bg-light;
    border-radius: 10px;
    margin: 0.5rem 0;
  }

  &::-webkit-scrollbar-thumb {
    background: $text-light-gray;
    border-radius: 10px;
    border: 2px solid $code-bg-dark;

    &:hover {
      background: $text-lighter-gray;
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
  }
}

.copy-code-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: $text-light-gray;
  cursor: pointer;
  font-size: 1rem;
  @include transition(all, 0.2s, ease);
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
    background: $bg-light;
    border-color: $border-color;
    color: #fff;
    transform: scale(1.05);
  }

  &.copied {
    background: $success-bg;
    border-color: $success-color;
    color: $success-color;
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
