<template>
  <Teleport to="body">
    <div
      v-if="visible && currentTerm"
      class="term-tooltip"
      :style="tooltipStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="tooltip-header">
        <h3 class="tooltip-term-title">{{ currentTerm.term }}</h3>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-translation">
          <span class="tooltip-label">Перевод:</span>
          <span class="tooltip-text">{{ currentTerm.translation || '—' }}</span>
        </div>
        <div v-if="currentTerm.examples && currentTerm.examples.length > 0" class="tooltip-example">
          <span class="tooltip-label">Пример:</span>
          <span class="tooltip-example-text">{{ getFirstExample(currentTerm.examples) }}</span>
        </div>
      </div>
      <div class="tooltip-footer">
        <button class="tooltip-view-btn" @click="goToDictionary">
          <BookOpenIcon class="tooltip-icon" />
          <span>Посмотреть в словаре</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { BookOpenIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  term: {
    type: Object,
    default: null,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
});

const emit = defineEmits(['close']);

const router = useRouter();
const visible = ref(false);
const tooltipStyle = ref<Record<string, string>>({});
const hideTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const showTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isHoveringTooltip = ref(false); // Флаг для отслеживания наведения на tooltip
const currentTerm = ref<import('../types/api').Term | null>(null); // Локальная копия term для сохранения при наведении
const offset = 50; // Отступ от курсора
const hideDelay = 300; // Задержка перед скрытием (мс)

const getFirstExample = (examples: Array<{ example: string } | string>) => {
  if (!examples || examples.length === 0) return '';
  const first = examples[0];
  if (!first) return '';
  return typeof first === 'string' ? first : first.example || '';
};

const updatePosition = () => {
  if (!props.position) return;

  const { x, y } = props.position;
  const tooltipWidth = 320; // Примерная ширина tooltip
  const tooltipHeight = 200; // Примерная высота tooltip
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let left = x + offset;
  let top = y + offset;

  // Проверяем границы экрана
  if (left + tooltipWidth > windowWidth) {
    left = x - tooltipWidth - offset;
  }

  if (top + tooltipHeight > windowHeight) {
    top = y - tooltipHeight - offset;
  }

  // Минимальные отступы от краев
  left = Math.max(10, Math.min(left, windowWidth - tooltipWidth - 10));
  top = Math.max(10, Math.min(top, windowHeight - tooltipHeight - 10));

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  };
};

const handleMouseEnter = () => {
  // Отменяем скрытие, если курсор на tooltip
  isHoveringTooltip.value = true;
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }
  // Сохраняем текущий term, чтобы tooltip не исчез
  if (props.term) {
    currentTerm.value = props.term as import('../types/api').Term;
  }
};

const handleMouseLeave = () => {
  // Когда курсор покидает tooltip, снимаем флаг и скрываем
  isHoveringTooltip.value = false;
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
  }
  hideTimer.value = setTimeout(() => {
    visible.value = false;
    emit('close');
  }, hideDelay);
};

const show = () => {
  // Отменяем предыдущий таймер скрытия
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }

  // Сохраняем term локально
  if (props.term) {
    currentTerm.value = props.term as import('../types/api').Term;
  }

  // Небольшая задержка перед показом для плавности
  if (showTimer.value) {
    clearTimeout(showTimer.value);
  }

  showTimer.value = setTimeout(() => {
    visible.value = true;
    updatePosition();
  }, 50);
};

const hide = () => {
  // Не скрываем, если курсор находится на tooltip
  if (isHoveringTooltip.value) {
    return;
  }
  // Увеличиваем задержку перед скрытием
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
  }
  hideTimer.value = setTimeout(() => {
    if (!isHoveringTooltip.value) {
      visible.value = false;
      currentTerm.value = null;
      emit('close');
    }
  }, hideDelay);
};

const goToDictionary = () => {
  // Закрываем tooltip сразу без задержки
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
    hideTimer.value = null;
  }
  isHoveringTooltip.value = false;
  visible.value = false;
  currentTerm.value = null;
  emit('close');
  router.push('/vocabulary');
};

watch(
  () => props.term,
  newTerm => {
    if (newTerm) {
      show();
    } else {
      // Не скрываем tooltip, если курсор находится на нем
      // В этом случае сохраняем текущий term
      if (isHoveringTooltip.value) {
        // Tooltip остается видимым с сохраненным term
        return;
      }
      hide();
    }
  }
);

watch(
  () => props.position,
  () => {
    if (visible.value) {
      updatePosition();
    }
  },
  { deep: true }
);

const handleMouseMove = () => {
  if (visible.value && currentTerm.value) {
    updatePosition();
  }
};

onMounted(() => {
  if (props.term) {
    currentTerm.value = props.term as import('../types/api').Term;
    show();
  }
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', hide, true);
});

onUnmounted(() => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value);
  }
  if (showTimer.value) {
    clearTimeout(showTimer.value);
  }
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('scroll', hide, true);
});

// Экспортируем методы для внешнего использования
defineExpose({
  show,
  hide,
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.term-tooltip {
  position: fixed;
  z-index: 10000;
  min-width: 280px;
  max-width: 400px;
  width: max-content;
  background: white;
  border: 1px solid $border-color;
  @include rounded-md;
  @include shadow-xl;
  pointer-events: auto;
  animation: fadeIn 0.2s ease-out;
  overflow: visible;
  // Добавляем невидимую область вокруг для легкого перехода курсора
  &::before {
    content: '';
    position: absolute;
    top: -15px;
    left: -15px;
    right: -15px;
    bottom: -15px;
    background: transparent;
    pointer-events: none; // Не блокируем клики
    z-index: -1; // Размещаем за основным контентом
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid $border-color;
  background: $bg-light;
}

.tooltip-term-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: $text-dark;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.tooltip-body {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tooltip-translation,
.tooltip-example {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-lighter-gray;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tooltip-text {
  font-size: 0.9375rem;
  color: $text-dark;
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.tooltip-example-text {
  font-size: 0.875rem;
  color: $text-light-gray;
  font-style: italic;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.tooltip-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid $border-color;
  background: $bg-light;
}

.tooltip-view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: $primary-color;
  color: white;
  border: none;
  @include rounded-md;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &:hover {
    background: $primary-hover;
    transform: translateY(-1px);
    @include shadow-hover;
  }

  &:active {
    transform: translateY(0);
  }
}

.tooltip-icon {
  width: 1rem;
  height: 1rem;
  color: inherit;
  flex-shrink: 0;
}
</style>
