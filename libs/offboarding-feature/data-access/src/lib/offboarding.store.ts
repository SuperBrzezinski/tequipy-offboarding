import { computed, Injectable, Signal, signal } from '@angular/core';

type EditingItem = { itemId: string; mode: 'return' | 'issue' };

/**
 * UI-only signal service — tracks which item form is currently open.
 *
 * All session persistence (item statuses, offboarding completion) lives in
 * IOffboardingRepository. This service owns only the transient UI state that
 * has no backend equivalent: "the admin has an open condition-select or note
 * field right now." This keeps the boundary clean: swap the in-memory repo for
 * an HTTP client and nothing here changes.
 */
@Injectable()
export class OffboardingStore {
  private readonly _editingItem = signal<EditingItem | null>(null);

  readonly isDirty: Signal<boolean> = computed(() => this._editingItem() !== null);
  readonly editingItem: Signal<EditingItem | null> = this._editingItem.asReadonly();

  beginReturn(itemId: string): void {
    this._editingItem.set({ itemId, mode: 'return' });
  }

  confirmReturn(): void {
    this._editingItem.set(null);
  }

  cancelReturn(): void {
    this._editingItem.set(null);
  }

  beginIssue(itemId: string): void {
    this._editingItem.set({ itemId, mode: 'issue' });
  }

  confirmIssue(): void {
    this._editingItem.set(null);
  }

  cancelIssue(): void {
    this._editingItem.set(null);
  }

  cancelAnyEdit(): void {
    this._editingItem.set(null);
  }
}
