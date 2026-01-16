<template>
  <div class="vocabulary-card">
    <div class="card-header">
      <div class="term-header-row">
        <h3 class="term-title">{{ props.term.term }}</h3>
        <button
          class="play-btn"
          :class="{ disabled: !isSupported }"
          :title="isSupported ? 'Воспроизвести термин' : 'Браузер не поддерживает озвучку'"
          :disabled="!isSupported"
          @click.stop="speakTerm(props.term.term)"
        >
          <SpeakerWaveIcon class="icon-small" />
        </button>
      </div>
      <div v-if="props.isAdmin" class="card-actions-top">
        <button class="edit-btn" title="Редактировать" @click="emit('edit', props.term)">
          <PencilIcon class="icon-small" />
        </button>
        <button class="delete-btn" title="Удалить" @click="emit('delete', props.term)">
          <TrashIcon class="icon-small" />
        </button>
      </div>
    </div>

    <div class="card-body">
      <div class="translation-section">
        <span class="translation-label">Перевод:</span>
        <span class="translation-text">{{ props.term.translation || '—' }}</span>
      </div>

      <div v-if="props.term.phrases && props.term.phrases.length > 0" class="phrases-section">
        <span class="phrases-label">Примеры словосочетаний:</span>
        <div class="phrases-list">
          <span v-for="(phrase, idx) in props.term.phrases" :key="idx" class="phrase-tag">
            {{ phrase.phrase }}
          </span>
        </div>
      </div>

      <div v-if="props.term.examples && props.term.examples.length > 0" class="examples-section">
        <span class="examples-label">Примеры использования:</span>
        <ul class="examples-list">
          <li v-for="(example, idx) in props.term.examples" :key="idx" class="example-item">
            {{ example.example }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PencilIcon, TrashIcon, SpeakerWaveIcon } from '@heroicons/vue/24/outline';
import { useTextToSpeech } from '../../composables/useTextToSpeech';

type TermCardProps = {
  id: string;
  term: string;
  translation: string;
  phrases: Array<{ phrase: string }>;
  examples: Array<{ example: string }>;
};

const props = defineProps<{
  term: TermCardProps;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  edit: [term: TermCardProps];
  delete: [term: TermCardProps];
}>();

const { isSupported, speak } = useTextToSpeech();

const speakTerm = (termText: string) => {
  speak(termText, { lang: 'en-GB' });
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.vocabulary-card {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-lg);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.term-header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.term-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.play-btn {
  padding: 0.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &:hover:not(.disabled) {
    background: var(--primary-hover);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-small {
    width: 18px;
    height: 18px;
  }
}

.card-actions-top {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-dark);
  border-radius: 6px;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &:hover {
    background: var(--hover-bg);
  }

  .icon-small {
    width: 18px;
    height: 18px;
  }
}

.delete-btn:hover {
  border-color: var(--error-color);
  color: var(--error-color);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.translation-section {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.translation-label {
  font-weight: 600;
  color: var(--text-light-gray);
  font-size: 0.875rem;
}

.translation-text {
  font-size: 1.125rem;
  color: var(--text-dark);
}

.phrases-section,
.examples-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.phrases-label,
.examples-label {
  font-weight: 600;
  color: var(--text-light-gray);
  font-size: 0.875rem;
}

.phrases-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.phrase-tag {
  padding: 0.375rem 0.75rem;
  background: var(--bg-light);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--text-gray);
}

.examples-list {
  margin: 0;
  padding-left: 1.5rem;
  list-style-type: disc;
}

.example-item {
  margin-bottom: 0.5rem;
  color: var(--text-gray);
  line-height: 1.6;
}
</style>
