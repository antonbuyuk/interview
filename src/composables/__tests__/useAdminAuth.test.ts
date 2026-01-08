import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

// Мокируем API клиент ПЕРЕД импортом
vi.mock('../../api/client', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { useAdminAuth } from '../useAdminAuth';
import { api } from '../../api/client';

describe('useAdminAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const TestComponent = defineComponent({
    setup() {
      const adminAuth = useAdminAuth();
      return adminAuth;
    },
    template: '<div>Test</div>',
  });

  describe('checkAuthStatus', () => {
    it('should return false when no auth token in localStorage', () => {
      const wrapper = mount(TestComponent);
      const { checkAuthStatus } = wrapper.vm;

      expect(checkAuthStatus()).toBe(false);
      expect(wrapper.vm.isAdmin).toBe(false);
    });

    it('should return true when auth token exists in localStorage', () => {
      localStorage.setItem('is_auth_admin', 'true');
      const wrapper = mount(TestComponent);
      const { checkAuthStatus } = wrapper.vm;

      expect(checkAuthStatus()).toBe(true);
      expect(wrapper.vm.isAdmin).toBe(true);
    });
  });

  describe('login', () => {
    it('should successfully login with correct password', async () => {
      const mockResponse = { success: true };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const wrapper = mount(TestComponent);
      const { login } = wrapper.vm;

      const result = await login('correct-password');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(api.post).toHaveBeenCalledWith('/admin/login', { password: 'correct-password' });
      expect(localStorage.getItem('is_auth_admin')).toBe('true');
      expect(wrapper.vm.isAdmin).toBe(true);
      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should fail login with incorrect password', async () => {
      const mockResponse = { success: false };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const wrapper = mount(TestComponent);
      const { login } = wrapper.vm;

      const result = await login('wrong-password');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(localStorage.getItem('is_auth_admin')).toBeNull();
      expect(wrapper.vm.isAdmin).toBe(false);
      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Network error');
      vi.mocked(api.post).mockRejectedValueOnce(mockError);

      const wrapper = mount(TestComponent);
      const { login } = wrapper.vm;

      const result = await login('password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(wrapper.vm.error).toBe('Network error');
      expect(wrapper.vm.isLoading).toBe(false);
      expect(localStorage.getItem('is_auth_admin')).toBeNull();
    });

    it('should set isLoading during login', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      vi.mocked(api.post).mockReturnValueOnce(promise as Promise<unknown>);

      const wrapper = mount(TestComponent);
      const { login } = wrapper.vm;

      const loginPromise = login('password');
      expect(wrapper.vm.isLoading).toBe(true);

      resolvePromise!({ success: true });
      await loginPromise;

      expect(wrapper.vm.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove auth token from localStorage', () => {
      localStorage.setItem('is_auth_admin', 'true');
      const wrapper = mount(TestComponent);
      const { logout, checkAuthStatus } = wrapper.vm;

      expect(checkAuthStatus()).toBe(true);

      logout();

      expect(localStorage.getItem('is_auth_admin')).toBeNull();
      expect(wrapper.vm.isAdmin).toBe(false);
    });
  });

  describe('storage sync', () => {
    it('should sync auth status when storage event fires', () => {
      const wrapper = mount(TestComponent);
      expect(wrapper.vm.isAdmin).toBe(false);

      // Симулируем изменение в другой вкладке
      localStorage.setItem('is_auth_admin', 'true');
      const storageEvent = new StorageEvent('storage', {
        key: 'is_auth_admin',
        newValue: 'true',
        storageArea: localStorage,
      });
      window.dispatchEvent(storageEvent);

      // Проверяем, что статус обновился
      expect(wrapper.vm.isAdmin).toBe(true);
    });

    it('should sync auth status when custom event fires', () => {
      const wrapper = mount(TestComponent);
      expect(wrapper.vm.isAdmin).toBe(false);

      // Симулируем кастомное событие
      const customEvent = new CustomEvent('admin-auth-changed', {
        detail: { isAdmin: true },
      });
      window.dispatchEvent(customEvent);

      expect(wrapper.vm.isAdmin).toBe(true);
    });

    it('should handle logout via custom event', () => {
      localStorage.setItem('is_auth_admin', 'true');
      const wrapper = mount(TestComponent);
      expect(wrapper.vm.isAdmin).toBe(true);

      const customEvent = new CustomEvent('admin-auth-changed', {
        detail: { isAdmin: false },
      });
      window.dispatchEvent(customEvent);

      expect(wrapper.vm.isAdmin).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('should return computed isAdmin', () => {
      localStorage.setItem('is_auth_admin', 'true');
      const wrapper = mount(TestComponent);

      expect(wrapper.vm.isAdmin).toBe(true);
      expect(typeof wrapper.vm.isAdmin).toBe('boolean');
    });

    it('should return computed isLoading', async () => {
      const wrapper = mount(TestComponent);
      const { login } = wrapper.vm;

      const loginPromise = login('password');
      expect(wrapper.vm.isLoading).toBe(true);

      vi.mocked(api.post).mockResolvedValueOnce({ success: false });
      await loginPromise;

      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should return computed error', async () => {
      const mockError = new Error('Test error');
      vi.mocked(api.post).mockRejectedValueOnce(mockError);

      const wrapper = mount(TestComponent);
      const { login } = wrapper.vm;

      await login('password');

      expect(wrapper.vm.error).toBe('Test error');
      expect(typeof wrapper.vm.error).toBe('string');
    });
  });
});
