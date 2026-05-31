import { computed, Injectable, Signal, signal } from '@angular/core';
import type {
  AssignedItem,
  Employee,
  EmployeeSession,
  ItemStatus,
  ReturnCondition,
  ReturnItem,
} from '@org/offboarding-feature/domain';
import { canComplete } from '@org/offboarding-feature/domain';

export type StoredSession = Omit<EmployeeSession, 'isDirty'>;

type EditingItem = { itemId: string; mode: 'return' | 'issue' };

/**
 * Application-layer signal service that owns the mutable session state for
 * employee offboarding flows.
 *
 * Design choices:
 * - No NgRx: plain injectable + signals is sufficient for this feature scope.
 * - Session map keyed by employeeId — navigation back preserves progress without
 *   hitting the repo again (see loadSession idempotency).
 * - isDirty is *not* stored in the session map; it's derived from editingItem so
 *   the domain EmployeeSession.isDirty field stays as a type concern, not a
 *   persistence concern.
 */
@Injectable()
export class OffboardingStore {
  // --- internal state -------------------------------------------------------

  private readonly _sessions = signal(new Map<string, StoredSession>());

  // Only one item can be in edit mode at a time — the single-employee-per-view flow makes this safe.
  private readonly _editingItem = signal<EditingItem | null>(null);

  // --- public API -----------------------------------------------------------

  /**
   * True while the admin has an open condition-select or note field.
   * Prevents accidental navigation away with unsaved state.
   */
  readonly isDirty: Signal<boolean> = computed(() => this._editingItem() !== null);

  /**
   * Set of employee IDs whose offboarding was completed in this session.
   * Used by the employee list to overlay the correct status without re-fetching.
   */
  readonly completedEmployeeIds: Signal<ReadonlySet<string>> = computed(() => {
    const ids = new Set<string>();
    this._sessions().forEach((session, id) => {
      if (session.offboardingStatus === 'Completed') ids.add(id);
    });
    return ids;
  });

  readonly editingItem: Signal<EditingItem | null> = this._editingItem.asReadonly();

  /**
   * Returns a stable computed Signal for a single session.
   * Yields null when the session has not been loaded yet.
   *
   * Note: a new computed is created per call — callers should call this once
   * and store the result (e.g. in a component signal field), not re-call on
   * every render.
   */
  getSession(employeeId: string): Signal<StoredSession | null> {
    return computed(() => this._sessions().get(employeeId) ?? null);
  }

  /**
   * Reactive variant: accepts a Signal<string> so the component creates one
   * stable computed rather than allocating a new one every time the outer
   * computed re-evaluates. Prefer this in component field initialisers.
   */
  getSessionReactive(employeeId: Signal<string>): Signal<StoredSession | null> {
    return computed(() => this._sessions().get(employeeId()) ?? null);
  }

  // --- session lifecycle ----------------------------------------------------

  /**
   * Enters a session for `employee`. If a session is already cached for this
   * employeeId (e.g. navigating back), this is a no-op so the admin's work
   * is preserved.
   *
   * Pre-completed employees retain their `offboardingStatus: 'Completed'` and
   * use `offboardingDate` as a placeholder completedAt timestamp, because the
   * mock dataset does not store a separate completion timestamp.
   */
  loadSession(employee: Employee, assignedItems: AssignedItem[]): void {
    const existing = this._sessions().get(employee.id);
    if (existing) {
      // Idempotent: navigating back must not reset in-progress work.
      return;
    }

    const initialStatus: ItemStatus =
      employee.offboardingStatus === 'Completed' ? 'Returned' : 'Pending';
    const items: ReturnItem[] = assignedItems.map((item) => ({
      item,
      status: initialStatus,
      returnCondition: undefined,
      note: '',
    }));

    const session: StoredSession = {
      employeeId: employee.id,
      items,
      offboardingStatus: employee.offboardingStatus,
      completedAt: employee.offboardingStatus === 'Completed' ? employee.offboardingDate : null,
    };

    this._sessions.update((map) => new Map(map).set(employee.id, session));
  }

  // --- item transitions -----------------------------------------------------

  /**
   * Opens the condition-select UI for a return flow.
   * Sets isDirty = true until confirmReturn is called.
   */
  beginReturn(_employeeId: string, itemId: string): void {
    this._editingItem.set({ itemId, mode: 'return' });
  }

  /**
   * Confirms the return: transitions Pending|Issue → Returned and records the
   * selected condition. Clears the editing state (isDirty → false).
   *
   * Throws if the item is not in a state that can transition to Returned.
   */
  confirmReturn(employeeId: string, itemId: string, condition: ReturnCondition): void {
    this._updateItem(employeeId, itemId, (item) => {
      if (item.status !== 'Pending' && item.status !== 'Issue') {
        throw new Error(
          `confirmReturn: item ${itemId} is in status '${item.status}', ` +
            `expected 'Pending' or 'Issue'.`,
        );
      }
      return { ...item, status: 'Returned', returnCondition: condition };
    });
    this._editingItem.set(null);
  }

  /**
   * Reverts a Returned item back to Pending. Clears returnCondition and note
   * so the admin can start fresh.
   *
   * Throws when the item is not in `Returned` status — every other transition
   * already guards its source state, and this symmetry prevents silent no-ops.
   */
  undoReturn(employeeId: string, itemId: string): void {
    this._updateItem(employeeId, itemId, (item) => {
      if (item.status !== 'Returned') {
        throw new Error(
          `undoReturn: item ${itemId} is in status '${item.status}', expected 'Returned'.`,
        );
      }
      return { ...item, status: 'Pending', returnCondition: undefined, note: '' };
    });
  }

  /**
   * Opens the note field for an issue flow.
   * Sets isDirty = true until confirmIssue or cancelIssue is called.
   */
  beginIssue(_employeeId: string, itemId: string): void {
    this._editingItem.set({ itemId, mode: 'issue' });
  }

  /**
   * Commits the issue: transitions Pending → Issue with a non-empty note.
   * Clears the editing state (isDirty → false).
   *
   * Throws if note is empty — a note is required to distinguish an issue from
   * a damage report without context.
   */
  confirmIssue(employeeId: string, itemId: string, note: string): void {
    if (!note.trim()) {
      throw new Error(`confirmIssue: note must not be empty for item ${itemId}.`);
    }
    this._updateItem(employeeId, itemId, (item) => {
      if (item.status !== 'Pending') {
        throw new Error(
          `confirmIssue: item ${itemId} is in status '${item.status}', expected 'Pending'.`,
        );
      }
      return { ...item, status: 'Issue', note };
    });
    this._editingItem.set(null);
  }

  /**
   * Discards the in-progress return edit without changing item state.
   * The item stays in its current status and isDirty goes back to false.
   */
  cancelReturn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _employeeId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _itemId: string,
  ): void {
    this._editingItem.set(null);
  }

  /**
   * Discards the in-progress issue edit without changing item state.
   * The item stays in its current status and isDirty goes back to false.
   */
  cancelIssue(
    // Symmetric signature with all other action methods so call sites are uniform.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _employeeId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _itemId: string,
  ): void {
    this._editingItem.set(null);
  }

  /**
   * Discards any open edit unconditionally. Used by the navigation guard when
   * the admin confirms they want to leave despite an uncommitted form.
   */
  cancelAnyEdit(): void {
    this._editingItem.set(null);
  }

  /**
   * Finalises the offboarding session. Throws if no session exists for
   * `employeeId` or if `canComplete` returns false (i.e. a Pending item or an
   * Issue item without a note still exists — the domain rule, not the store's).
   */
  completeOffboarding(employeeId: string): void {
    const session = this._sessions().get(employeeId);
    if (!session) {
      throw new Error(`completeOffboarding: no session loaded for employee ${employeeId}.`);
    }
    if (!canComplete(session.items)) {
      throw new Error(
        `completeOffboarding: session for ${employeeId} cannot be completed — ` +
          `one or more items are still Pending, or an Issue item is missing a note.`,
      );
    }

    this._sessions.update((map) =>
      new Map(map).set(employeeId, {
        ...session,
        offboardingStatus: 'Completed',
        completedAt: new Date().toISOString(),
      }),
    );
    this._editingItem.set(null);
  }

  // --- private helpers ------------------------------------------------------

  private _updateItem(
    employeeId: string,
    itemId: string,
    transform: (item: ReturnItem) => ReturnItem,
  ): void {
    this._sessions.update((map) => {
      const session = map.get(employeeId);
      if (!session) {
        throw new Error(`_updateItem: no session loaded for employee ${employeeId}.`);
      }

      const updatedItems = session.items.map((ri) => (ri.item.id === itemId ? transform(ri) : ri));

      return new Map(map).set(employeeId, { ...session, items: updatedItems });
    });
  }
}
