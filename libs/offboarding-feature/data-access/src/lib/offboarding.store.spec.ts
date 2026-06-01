import { beforeEach, describe, expect, it } from 'vitest';
import { OffboardingStore } from './offboarding.store';

describe('OffboardingStore', () => {
  let store: OffboardingStore;

  beforeEach(() => {
    store = new OffboardingStore();
  });

  it('starts with no editing item and isDirty = false', () => {
    expect(store.editingItem()).toBeNull();
    expect(store.isDirty()).toBe(false);
  });

  describe('return flow', () => {
    it('beginReturn sets editingItem with return mode and isDirty = true', () => {
      store.beginReturn('item-1');

      expect(store.editingItem()).toEqual({ itemId: 'item-1', mode: 'return' });
      expect(store.isDirty()).toBe(true);
    });

    it('confirmReturn clears editingItem and isDirty = false', () => {
      store.beginReturn('item-1');
      store.confirmReturn();

      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });

    it('cancelReturn clears editingItem and isDirty = false', () => {
      store.beginReturn('item-1');
      store.cancelReturn();

      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });
  });

  describe('issue flow', () => {
    it('beginIssue sets editingItem with issue mode and isDirty = true', () => {
      store.beginIssue('item-2');

      expect(store.editingItem()).toEqual({ itemId: 'item-2', mode: 'issue' });
      expect(store.isDirty()).toBe(true);
    });

    it('confirmIssue clears editingItem and isDirty = false', () => {
      store.beginIssue('item-2');
      store.confirmIssue();

      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });

    it('cancelIssue clears editingItem and isDirty = false', () => {
      store.beginIssue('item-2');
      store.cancelIssue();

      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });
  });

  describe('cancelAnyEdit', () => {
    it('clears return editing state', () => {
      store.beginReturn('item-1');
      store.cancelAnyEdit();

      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });

    it('clears issue editing state', () => {
      store.beginIssue('item-2');
      store.cancelAnyEdit();

      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });

    it('is a no-op when nothing is being edited', () => {
      expect(() => store.cancelAnyEdit()).not.toThrow();
      expect(store.isDirty()).toBe(false);
    });
  });
});
