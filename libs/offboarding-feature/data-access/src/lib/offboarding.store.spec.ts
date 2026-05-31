import { beforeEach, describe, expect, it } from 'vitest';
import type { AssignedItem, Employee } from '@org/offboarding-feature/domain';
import type { StoredSession } from './offboarding.store';
import { OffboardingStore } from './offboarding.store';

/**
 * Narrow a `Signal<StoredSession | null>()` result to `StoredSession` and fail
 * fast when the session is unexpectedly absent. Preferred over the `!`
 * non-null assertion operator so tests produce a meaningful failure message.
 */
function assertSession(value: StoredSession | null): StoredSession {
  if (value === null) {
    throw new Error('Expected a loaded session but got null');
  }
  return value;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    name: 'Alice',
    department: 'Engineering',
    email: 'alice@example.com',
    offboardingDate: '2024-03-01',
    offboardingStatus: 'In progress',
    ...overrides,
  };
}

function makeItem(id: string, employeeId = 'emp-1'): AssignedItem {
  return {
    id,
    employeeId,
    name: `Item ${id}`,
    type: 'Laptop',
    assignedCondition: 'Good',
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('OffboardingStore', () => {
  let store: OffboardingStore;

  beforeEach(() => {
    // Plain instantiation — no TestBed needed because this service has no
    // injected dependencies. Angular signals work fine outside a DI context.
    store = new OffboardingStore();
  });

  // -------------------------------------------------------------------------
  // 1. loadSession initialisation
  // -------------------------------------------------------------------------

  describe('loadSession', () => {
    it('initialises all items as Pending with empty notes', () => {
      const employee = makeEmployee();
      const items = [makeItem('item-1'), makeItem('item-2')];

      store.loadSession(employee, items);

      const session = assertSession(store.getSession('emp-1')());
      expect(session.items).toHaveLength(2);
      session.items.forEach((ri) => {
        expect(ri.status).toBe('Pending');
        expect(ri.note).toBe('');
        expect(ri.returnCondition).toBeUndefined();
      });
    });

    it('sets offboardingStatus and null completedAt for an In progress employee', () => {
      store.loadSession(makeEmployee({ offboardingStatus: 'In progress' }), []);

      const session = assertSession(store.getSession('emp-1')());
      expect(session.offboardingStatus).toBe('In progress');
      expect(session.completedAt).toBeNull();
    });

    it('uses offboardingDate as placeholder completedAt for a pre-completed employee', () => {
      store.loadSession(
        makeEmployee({ offboardingStatus: 'Completed', offboardingDate: '2024-01-15' }),
        [],
      );

      const session = assertSession(store.getSession('emp-1')());
      expect(session.offboardingStatus).toBe('Completed');
      // We don't have a real completion timestamp in mock data, so we fall back
      // to the offboarding date so the UI can show *something* meaningful.
      expect(session.completedAt).toBe('2024-01-15');
    });

    it('initialises items as Returned for a pre-completed employee', () => {
      store.loadSession(makeEmployee({ offboardingStatus: 'Completed' }), [makeItem('item-1')]);
      const session = assertSession(store.getSession('emp-1')());
      expect(session.items[0].status).toBe('Returned');
    });

    // -----------------------------------------------------------------------
    // 2. Idempotency
    // -----------------------------------------------------------------------

    it('is idempotent — calling twice does not reset state', () => {
      // Navigation back must restore state so the admin does not lose work they
      // did before clicking the back button.
      const employee = makeEmployee();
      const item = makeItem('item-1');
      store.loadSession(employee, [item]);

      // Advance state: mark the item as Returned
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Good');

      // Simulate navigating away and back: loadSession called a second time
      store.loadSession(employee, [item]);

      const session = assertSession(store.getSession('emp-1')());
      expect(session.items[0].status).toBe('Returned'); // state preserved
    });
  });

  // -------------------------------------------------------------------------
  // 3. confirmReturn — Pending → Returned
  // -------------------------------------------------------------------------

  describe('confirmReturn', () => {
    it('transitions Pending → Returned, records condition, clears editingItem, isDirty false', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      store.beginReturn('emp-1', 'item-1');

      store.confirmReturn('emp-1', 'item-1', 'Good');

      const session = assertSession(store.getSession('emp-1')());
      const ri = session.items[0];
      expect(ri.status).toBe('Returned');
      expect(ri.returnCondition).toBe('Good');
      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });

    // -----------------------------------------------------------------------
    // 5. confirmReturn — Issue → Returned
    // -----------------------------------------------------------------------

    it('throws when item is already Returned', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Good');
      // Calling again on an already-Returned item must not silently succeed
      expect(() => store.confirmReturn('emp-1', 'item-1', 'Damaged')).toThrow();
    });

    it('transitions Issue → Returned (condition downgrade path)', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      // First put the item into Issue state
      store.beginIssue('emp-1', 'item-1');
      store.confirmIssue('emp-1', 'item-1', 'Screen cracked');

      // Now the admin decides to mark it Returned instead
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Damaged');

      const session = assertSession(store.getSession('emp-1')());
      const ri = session.items[0];
      expect(ri.status).toBe('Returned');
      expect(ri.returnCondition).toBe('Damaged');
      expect(store.isDirty()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 6. undoReturn — Returned → Pending
  // -------------------------------------------------------------------------

  describe('undoReturn', () => {
    it('throws when called on a non-Returned item', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      expect(() => store.undoReturn('emp-1', 'item-1')).toThrow();
    });

    it('reverts Returned → Pending, clears returnCondition and note', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Damaged');

      store.undoReturn('emp-1', 'item-1');

      const session = assertSession(store.getSession('emp-1')());
      const ri = session.items[0];
      expect(ri.status).toBe('Pending');
      expect(ri.returnCondition).toBeUndefined();
      expect(ri.note).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // 5. confirmIssue — Pending → Issue
  // -------------------------------------------------------------------------

  describe('confirmIssue', () => {
    it('transitions Pending → Issue with note, clears editingItem, isDirty false', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      store.beginIssue('emp-1', 'item-1');

      store.confirmIssue('emp-1', 'item-1', 'Charger missing');

      const session = assertSession(store.getSession('emp-1')());
      const ri = session.items[0];
      expect(ri.status).toBe('Issue');
      expect(ri.note).toBe('Charger missing');
      expect(store.editingItem()).toBeNull();
      expect(store.isDirty()).toBe(false);
    });

    it('throws when note is empty — a note is required for an Issue', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      store.beginIssue('emp-1', 'item-1');

      expect(() => store.confirmIssue('emp-1', 'item-1', '')).toThrow();
      expect(() => store.confirmIssue('emp-1', 'item-1', '   ')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 6. completeOffboarding
  // -------------------------------------------------------------------------

  describe('completeOffboarding', () => {
    it('marks the session Completed with a non-null ISO completedAt when all items are returned', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1'), makeItem('item-2')]);
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Good');
      store.beginReturn('emp-1', 'item-2');
      store.confirmReturn('emp-1', 'item-2', 'Damaged');

      store.completeOffboarding('emp-1');

      const session = assertSession(store.getSession('emp-1')());
      expect(session.offboardingStatus).toBe('Completed');
      expect(session.completedAt).not.toBeNull();
      // completedAt must be a valid ISO 8601 string
      expect(new Date(session.completedAt!).toISOString()).toBe(session.completedAt);
    });

    it('leaves items array unchanged after completion', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1')]);
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Good');

      store.completeOffboarding('emp-1');

      const session = assertSession(store.getSession('emp-1')());
      expect(session.items).toHaveLength(1);
      expect(session.items[0].status).toBe('Returned');
      expect(session.items[0].returnCondition).toBe('Good');
    });

    it('throws when at least one item is still Pending', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1'), makeItem('item-2')]);
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Good');
      // item-2 remains Pending

      expect(() => store.completeOffboarding('emp-1')).toThrow();
    });

    it('throws when the session does not exist', () => {
      expect(() => store.completeOffboarding('nonexistent-id')).toThrow();
    });

    it('succeeds when all items are Issue status with non-empty notes', () => {
      store.loadSession(makeEmployee(), [makeItem('item-1'), makeItem('item-2')]);
      store.beginIssue('emp-1', 'item-1');
      store.confirmIssue('emp-1', 'item-1', 'Broken hinge');
      store.beginIssue('emp-1', 'item-2');
      store.confirmIssue('emp-1', 'item-2', 'Missing charger');

      store.completeOffboarding('emp-1');

      const session = assertSession(store.getSession('emp-1')());
      expect(session.offboardingStatus).toBe('Completed');
    });

    it('clears editingItem so isDirty is false after completion', () => {
      // Set up two items: confirm both returns, then re-open begin on one to
      // simulate the admin having the return panel open when they hit "Complete".
      store.loadSession(makeEmployee(), [makeItem('item-1'), makeItem('item-2')]);
      store.beginReturn('emp-1', 'item-1');
      store.confirmReturn('emp-1', 'item-1', 'Good');
      store.beginReturn('emp-1', 'item-2');
      store.confirmReturn('emp-1', 'item-2', 'Good');

      // Re-open the return panel for item-1 — puts store in dirty state
      store.beginReturn('emp-1', 'item-1');
      expect(store.isDirty()).toBe(true);

      store.completeOffboarding('emp-1');

      expect(store.isDirty()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 12. Session cache — navigation between employees
  // -------------------------------------------------------------------------

  describe('session cache', () => {
    it('preserves session A state when navigating to B and back to A', () => {
      // Navigation back must restore state so admin does not lose work.
      const empA = makeEmployee({ id: 'emp-A' });
      const empB = makeEmployee({ id: 'emp-B' });
      const itemA = makeItem('item-A', 'emp-A');
      const itemB = makeItem('item-B', 'emp-B');

      // Load A and advance state
      store.loadSession(empA, [itemA]);
      store.beginReturn('emp-A', 'item-A');
      store.confirmReturn('emp-A', 'item-A', 'Damaged');

      // Navigate to B and load it
      store.loadSession(empB, [itemB]);
      const sessionB = assertSession(store.getSession('emp-B')());
      expect(sessionB.items[0].status).toBe('Pending');

      // Navigate back to A — loadSession must be a no-op that preserves state
      store.loadSession(empA, [itemA]);
      const sessionA = assertSession(store.getSession('emp-A')());
      expect(sessionA.items[0].status).toBe('Returned'); // A's state intact
      expect(sessionA.items[0].returnCondition).toBe('Damaged');
    });
  });
});
