import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmationService } from 'primeng/api';
import { OFFBOARDING_REPO, OffboardingStore } from '@org/offboarding-feature/data-access';
import type {
  AssignedItem,
  Employee,
  IOffboardingRepository,
  ReturnCondition,
} from '@org/offboarding-feature/domain';
import { describe, expect, it, vi } from 'vitest';
import { EquipmentListComponent } from '../equipment-list/equipment-list.component';
import { SummaryPanelComponent } from '../summary-panel/summary-panel.component';
import { OffboardingSessionPageComponent } from './offboarding-session-page.component';

const EMPLOYEE: Employee = {
  id: 'emp-test',
  name: 'Jane Tester',
  department: 'QA',
  email: 'jane@t.com',
  offboardingDate: '2026-07-01',
  offboardingStatus: 'In progress',
};

const ITEMS: AssignedItem[] = [
  {
    id: 'i-1',
    employeeId: 'emp-test',
    name: 'MacBook',
    type: 'Laptop',
    assignedCondition: 'Good',
    status: 'Pending',
    note: '',
  },
  {
    id: 'i-2',
    employeeId: 'emp-test',
    name: 'Monitor',
    type: 'Monitor',
    assignedCondition: 'Good',
    status: 'Pending',
    note: '',
  },
];

/**
 * Builds a stateful in-memory mock repo so mutation methods actually update
 * item state. This mirrors what a real HTTP backend would do and lets
 * component tests exercise the full round-trip (call → update → render).
 */
function makeRepo(overrides: Partial<IOffboardingRepository> = {}): IOffboardingRepository {
  const store = new Map<string, AssignedItem[]>();

  function itemsFor(employeeId: string): AssignedItem[] {
    return store.get(employeeId) ?? [];
  }

  const base: IOffboardingRepository = {
    getEmployees: vi.fn().mockResolvedValue([EMPLOYEE]),

    getEmployee: vi.fn().mockResolvedValue(EMPLOYEE),

    getAssignedItems: vi.fn((employeeId: string) => {
      if (!store.has(employeeId)) {
        store.set(
          employeeId,
          ITEMS.map((i) => ({ ...i })),
        );
      }
      return Promise.resolve(itemsFor(employeeId).map((i) => ({ ...i })));
    }),

    markItemReturned: vi.fn((employeeId: string, itemId: string, condition: ReturnCondition) => {
      const updated = itemsFor(employeeId).map((i) =>
        i.id === itemId ? { ...i, status: 'Returned' as const, returnCondition: condition } : i,
      );
      store.set(employeeId, updated);
      return Promise.resolve(updated.map((i) => ({ ...i })));
    }),

    markItemIssue: vi.fn((employeeId: string, itemId: string, note: string) => {
      const updated = itemsFor(employeeId).map((i) =>
        i.id === itemId ? { ...i, status: 'Issue' as const, note } : i,
      );
      store.set(employeeId, updated);
      return Promise.resolve(updated.map((i) => ({ ...i })));
    }),

    revertItem: vi.fn((employeeId: string, itemId: string) => {
      const updated = itemsFor(employeeId).map((i) =>
        i.id === itemId
          ? { ...i, status: 'Pending' as const, returnCondition: undefined, note: '' }
          : i,
      );
      store.set(employeeId, updated);
      return Promise.resolve(updated.map((i) => ({ ...i })));
    }),

    completeOffboarding: vi.fn(() => Promise.resolve(new Date().toISOString())),
  };

  return { ...base, ...overrides };
}

async function renderPage(repo: IOffboardingRepository, employeeId = 'emp-test') {
  return render(OffboardingSessionPageComponent, {
    inputs: { employeeId },
    providers: [
      provideRouter([]),
      { provide: OFFBOARDING_REPO, useValue: repo },
      OffboardingStore,
      ConfirmationService,
    ],
  });
}

// Fires the confirmReturn output of tq-equipment-list.
function triggerReturn(
  fixture: ComponentFixture<OffboardingSessionPageComponent>,
  itemId: string,
  condition: ReturnCondition,
): void {
  const equipList = fixture.debugElement.query(By.directive(EquipmentListComponent));
  equipList.triggerEventHandler('confirmReturn', { itemId, condition });
}

// Fires the confirmIssue output of tq-equipment-list.
function triggerConfirmIssue(
  fixture: ComponentFixture<OffboardingSessionPageComponent>,
  itemId: string,
  note: string,
): void {
  const equipList = fixture.debugElement.query(By.directive(EquipmentListComponent));
  equipList.triggerEventHandler('confirmIssue', { itemId, note });
}

// Fires the complete output of tq-summary-panel.
function triggerComplete(fixture: ComponentFixture<OffboardingSessionPageComponent>): void {
  const summaryPanel = fixture.debugElement.query(By.directive(SummaryPanelComponent));
  summaryPanel.triggerEventHandler('complete', null);
}

describe('OffboardingSessionPageComponent', () => {
  it('shows the employee name in the heading after loading', async () => {
    const repo = makeRepo();
    await renderPage(repo);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Jane Tester' })).toBeTruthy());
  });

  it('renders equipment items after loading', async () => {
    const repo = makeRepo();
    await renderPage(repo);

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'MacBook' })).toBeTruthy();
      expect(screen.getByRole('article', { name: 'Monitor' })).toBeTruthy();
    });
  });

  it('shows employee-not-found when the id does not match any employee', async () => {
    const repo = makeRepo({ getEmployee: vi.fn().mockResolvedValue(undefined) });
    await renderPage(repo, 'bad-id');

    await waitFor(() => expect(screen.getByText(/Employee not found/i)).toBeTruthy());
  });

  it('shows error state when repository rejects', async () => {
    const repo = makeRepo({ getEmployee: vi.fn().mockRejectedValue(new Error('fail')) });
    await renderPage(repo);

    await waitFor(() => expect(screen.getByText(/Failed to load employee session/i)).toBeTruthy());
  });

  describe('condition-downgrade dialog (onConfirmReturn)', () => {
    it('does not show a confirm dialog when returning with the same or better condition', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const confirmSpy = vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      );

      triggerReturn(fixture, 'i-1', 'Good');

      expect(confirmSpy).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.getByText(/Return condition: Good/i)).toBeTruthy());
    });

    it('shows a condition-downgrade ConfirmDialog when returning with a worse condition', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const confirmSpy = vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      );

      triggerReturn(fixture, 'i-1', 'Damaged');

      expect(confirmSpy).toHaveBeenCalledOnce();
      const call = confirmSpy.mock.calls[0][0];
      expect(call.message).toContain('MacBook');
      expect(call.message).toContain('Good');
      expect(call.message).toContain('Damaged');
      expect(screen.getByRole('button', { name: /Mark MacBook as returned/i })).toBeTruthy();
    });

    it('commits the return only after the dialog accept callback fires', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      let acceptCallback: (() => void) | undefined;
      vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      ).mockImplementation((opts) => {
        acceptCallback = opts.accept as () => void;
        return undefined as unknown as ConfirmationService;
      });

      triggerReturn(fixture, 'i-1', 'Damaged');
      expect(screen.getByRole('button', { name: /Mark MacBook as returned/i })).toBeTruthy();

      acceptCallback?.();

      await waitFor(() => expect(screen.getByText(/Return condition: Damaged/i)).toBeTruthy());
    });
  });

  it('navigates back to the list when Back is clicked', async () => {
    const navigate = vi.fn();
    const user = userEvent.setup();
    const repo = makeRepo();

    await render(OffboardingSessionPageComponent, {
      inputs: { employeeId: 'emp-test' },
      providers: [
        provideRouter([]),
        { provide: OFFBOARDING_REPO, useValue: repo },
        { provide: Router, useValue: { navigate } },
        OffboardingStore,
        ConfirmationService,
      ],
    });

    const backBtn = screen.getByRole('button', { name: /Back to employee list/i });
    await user.click(backBtn);

    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  describe('onComplete() with open Issues confirm dialog', () => {
    it('shows ConfirmDialog listing issue item names when open issues remain', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const confirmSpy = vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      );

      triggerConfirmIssue(fixture, 'i-1', 'Screen cracked');
      triggerReturn(fixture, 'i-2', 'Good');

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /Mark Monitor as returned/i })).toBeNull(),
      );

      triggerComplete(fixture);

      expect(confirmSpy).toHaveBeenCalledOnce();
      const call = confirmSpy.mock.calls[0][0];
      expect(call.header).toBe('Unresolved issues');
      expect(call.message).toContain('MacBook');
      expect(call.message).toContain('Screen cracked');
    });

    it('completes the session only after the dialog accept callback fires', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      let acceptCallback: (() => void) | undefined;
      vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      ).mockImplementation((opts) => {
        acceptCallback = opts.accept as () => void;
        return undefined as unknown as ConfirmationService;
      });

      triggerConfirmIssue(fixture, 'i-1', 'Screen cracked');
      triggerReturn(fixture, 'i-2', 'Good');

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /Mark Monitor as returned/i })).toBeNull(),
      );

      triggerComplete(fixture);
      expect(screen.queryByText(/Offboarding completed/i)).toBeNull();

      acceptCallback?.();

      await waitFor(() => expect(screen.getByText(/Offboarding completed/i)).toBeTruthy());
    });

    it('does NOT show ConfirmDialog when all items are Returned (no open issues)', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const confirmSpy = vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      );

      triggerReturn(fixture, 'i-1', 'Good');
      triggerReturn(fixture, 'i-2', 'Good');

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /Mark MacBook as returned/i })).toBeNull(),
      );

      triggerComplete(fixture);

      expect(confirmSpy).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.getByText(/Offboarding completed/i)).toBeTruthy());
    });
  });

  describe('complete flow (integration — real store + stateful mock repo)', () => {
    it('transitions Pending → all Returned → Completed and shows completed banner', async () => {
      const user = userEvent.setup();
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);

      await waitFor(() => {
        expect(screen.getByRole('article', { name: 'MacBook' })).toBeTruthy();
        expect(screen.getByRole('article', { name: 'Monitor' })).toBeTruthy();
      });

      expect(
        (screen.getByRole('button', { name: /Complete offboarding/i }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      triggerReturn(fixture, 'i-1', 'Good');
      triggerReturn(fixture, 'i-2', 'Good');

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /Complete offboarding/i });
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      });

      await user.click(screen.getByRole('button', { name: /Complete offboarding/i }));

      await waitFor(() => expect(screen.getByText(/Offboarding completed/i)).toBeTruthy());
    });
  });
});
