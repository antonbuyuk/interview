import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

// Мокируем ПЕРЕД импортом
vi.mock('../../utils/questionParser', () => ({
  parseQuestionsForTraining: vi.fn(),
}));

import { useTrainingMode } from '../useTrainingMode';
import { parseQuestionsForTraining } from '../../utils/questionParser';

describe('useTrainingMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const TestComponent = defineComponent({
    setup() {
      const trainingMode = useTrainingMode();
      return trainingMode;
    },
    template: '<div>Test</div>',
  });

  describe('default settings', () => {
    it('should have default settings', () => {
      const wrapper = mount(TestComponent);
      const settings = wrapper.vm.settings;

      expect(settings.englishOnly).toBe(false);
      expect(settings.ttsRate).toBe(1.0);
      expect(settings.ttsPitch).toBe(1.0);
      expect(settings.ttsVoice).toBeNull();
      expect(settings.flashCardAutoFlip).toBe(false);
      expect(settings.flashCardDuration).toBe(10);
      expect(settings.practiceTimerDuration).toBe(2);
    });
  });

  describe('settings persistence', () => {
    it('should load settings from localStorage', () => {
      const savedSettings = {
        englishOnly: true,
        ttsRate: 1.5,
        ttsPitch: 1.2,
        flashCardDuration: 15,
      };
      localStorage.setItem('training-mode-settings', JSON.stringify(savedSettings));

      const wrapper = mount(TestComponent);
      const settings = wrapper.vm.settings;

      expect(settings.englishOnly).toBe(true);
      expect(settings.ttsRate).toBe(1.5);
      expect(settings.ttsPitch).toBe(1.2);
      expect(settings.flashCardDuration).toBe(15);
      // Проверяем, что остальные значения остались дефолтными
      expect(settings.ttsVoice).toBeNull();
      expect(settings.flashCardAutoFlip).toBe(false);
      expect(settings.practiceTimerDuration).toBe(2);
    });

    it('should save settings to localStorage on change', async () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.englishOnly = true;
      wrapper.vm.ttsRate = 1.5;

      // Ждем следующего тика для сохранения через watch
      await wrapper.vm.$nextTick();

      const saved = JSON.parse(localStorage.getItem('training-mode-settings') || '{}');
      expect(saved.englishOnly).toBe(true);
      expect(saved.ttsRate).toBe(1.5);
    });

    it('should use default settings if localStorage is empty', () => {
      localStorage.removeItem('training-mode-settings');
      const wrapper = mount(TestComponent);

      const settings = wrapper.vm.settings;
      expect(settings.englishOnly).toBe(false);
      expect(settings.ttsRate).toBe(1.0);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('training-mode-settings', 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mount(TestComponent);
      const settings = wrapper.vm.settings;

      expect(settings.englishOnly).toBe(false);
      expect(settings.ttsRate).toBe(1.0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('settings modification', () => {
    it('should update englishOnly setting', async () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.englishOnly = true;

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.englishOnly).toBe(true);
      expect(wrapper.vm.settings.englishOnly).toBe(true);
    });

    it('should update ttsRate setting', async () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.ttsRate = 1.5;

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.ttsRate).toBe(1.5);
      expect(wrapper.vm.settings.ttsRate).toBe(1.5);
    });

    it('should update ttsPitch setting', async () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.ttsPitch = 1.3;

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.ttsPitch).toBe(1.3);
      expect(wrapper.vm.settings.ttsPitch).toBe(1.3);
    });

    it('should update flashCardDuration setting', async () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.flashCardDuration = 20;

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.flashCardDuration).toBe(20);
      expect(wrapper.vm.settings.flashCardDuration).toBe(20);
    });

    it('should update practiceTimerDuration setting', async () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.practiceTimerDuration = 5;

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.practiceTimerDuration).toBe(5);
      expect(wrapper.vm.settings.practiceTimerDuration).toBe(5);
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to default values', () => {
      const wrapper = mount(TestComponent);

      // Изменяем настройки
      wrapper.vm.englishOnly = true;
      wrapper.vm.ttsRate = 1.5;
      wrapper.vm.ttsPitch = 1.3;
      wrapper.vm.flashCardDuration = 20;

      // Сбрасываем
      wrapper.vm.resetSettings();

      const settings = wrapper.vm.settings;
      expect(settings.englishOnly).toBe(false);
      expect(settings.ttsRate).toBe(1.0);
      expect(settings.ttsPitch).toBe(1.0);
      expect(settings.flashCardDuration).toBe(10);
      expect(settings.practiceTimerDuration).toBe(2);
    });

    it('should save default settings to localStorage after reset', () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.resetSettings();

      const saved = JSON.parse(localStorage.getItem('training-mode-settings') || '{}');
      expect(saved.englishOnly).toBe(false);
      expect(saved.ttsRate).toBe(1.0);
      expect(saved.ttsPitch).toBe(1.0);
    });
  });

  describe('extractQuestionData', () => {
    it('should call parseQuestionsForTraining with correct arguments', () => {
      const mockMarkdown = '### 1. Question text';
      const mockSectionId = 'test-section';
      const mockQuestions = [
        {
          id: 'question-1',
          number: 1,
          question: 'Question text',
          sectionId: mockSectionId,
          hasAnswerEn: false,
          hasAnswerRu: false,
          hasAnswerSenior: false,
        },
      ];

      vi.mocked(parseQuestionsForTraining).mockReturnValueOnce(mockQuestions as never);

      const wrapper = mount(TestComponent);
      const result = wrapper.vm.extractQuestionData(mockMarkdown, mockSectionId);

      expect(parseQuestionsForTraining).toHaveBeenCalledWith(mockMarkdown, mockSectionId);
      expect(result).toEqual(mockQuestions);
    });

    it('should return empty array if parseQuestionsForTraining returns empty', () => {
      vi.mocked(parseQuestionsForTraining).mockReturnValueOnce([] as never);

      const wrapper = mount(TestComponent);
      const result = wrapper.vm.extractQuestionData('', 'test-section');

      expect(result).toEqual([]);
    });
  });

  describe('saveSettings and loadSettings', () => {
    it('should manually save and load settings', () => {
      const wrapper = mount(TestComponent);
      wrapper.vm.englishOnly = true;
      wrapper.vm.ttsRate = 1.5;

      wrapper.vm.saveSettings();

      // Очищаем и проверяем загрузку
      const saved = JSON.parse(localStorage.getItem('training-mode-settings') || '{}');
      expect(saved.englishOnly).toBe(true);
      expect(saved.ttsRate).toBe(1.5);

      // Проверяем загрузку
      wrapper.vm.loadSettings();
      expect(wrapper.vm.settings.englishOnly).toBe(true);
      expect(wrapper.vm.settings.ttsRate).toBe(1.5);
    });
  });
});
