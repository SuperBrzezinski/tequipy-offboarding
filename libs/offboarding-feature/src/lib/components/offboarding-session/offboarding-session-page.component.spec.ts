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
  { id: 'i-1', employeeId: 'emp-test', name: 'MacBook', type: 'Laptop', assignedCondition: 'Good' },
  {
    id: 'i-2',
    employeeId: 'emp-test',
    name: 'Monitor',
    type: 'Monitor',
    assignedCondition: 'Good',
  },
];

function makeRepo(overrides: Partial<IOffboardingRepository> = {}): IOffboardingRepository {
  return {
    getEmployees: vi.fn().mockResolvedValue([EMPLOYEE]),
    getEmployee: vi.fn().mockResolvedValue(EMPLOYEE),
    getAssignedItems: vi.fn().mockResolvedValue(ITEMS),
    ...overrides,
  };
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

// Fires the confirmReturn output of lib-equipment-list — drives an item into Returned status.
// We bypass the p-select UI because PrimeNG overlays do not position correctly in JSDOM;
// the condition-select interaction is already covered by equipment-row.component.spec.ts.
function triggerReturn(
  fixture: ComponentFixture<OffboardingSessionPageComponent>,
  itemId: string,
  condition: ReturnCondition,
): void {
  const equipList = fixture.debugElement.query(By.directive(EquipmentListComponent));
  equipList.triggerEventHandler('confirmReturn', { itemId, condition });
  fixture.detectChanges();
}

// Fires the confirmIssue output of lib-equipment-list.
function triggerConfirmIssue(
  fixture: ComponentFixture<OffboardingSessionPageComponent>,
  itemId: string,
  note: string,
): void {
  const equipList = fixture.debugElement.query(By.directive(EquipmentListComponent));
  equipList.triggerEventHandler('confirmIssue', { itemId, note });
  fixture.detectChanges();
}

// Fires the complete output of lib-summary-panel (equivalent to the admin clicking the button).
function triggerComplete(fixture: ComponentFixture<OffboardingSessionPageComponent>): void {
  const summaryPanel = fixture.debugElement.query(By.directive(SummaryPanelComponent));
  summaryPanel.triggerEventHandler('complete', null);
  fixture.detectChanges();
}

describe('OffboardingSessionPageComponent', () => {
  it('shows the employee name in the heading after loading', async () => {
    const repo = makeRepo();
    await renderPage(repo);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Jane Tester' })).toBeTruthy());
  });

  it('renders equipment items after loading', async () => {
    // The equipment list (not a placeholder) should show both assigned items.
    // Query by aria-label on the article element to avoid ambiguity with type tags.
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
      // Good → Good: severity stays the same, no dialog needed.
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const confirmSpy = vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      );

      triggerReturn(fixture, 'i-1', 'Good');

      expect(confirmSpy).not.toHaveBeenCalled();
      // Item is now Returned — the DOM shows the return condition
      expect(screen.getByText(/Return condition: Good/i)).toBeTruthy();
    });

    it('shows a condition-downgrade ConfirmDialog when returning with a worse condition', async () => {
      // Good → Damaged: downgrade detected, dialog must appear before committing.
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
      // Item must NOT be committed yet — its action buttons are still visible (still Pending)
      expect(screen.getByRole('button', { name: /Mark MacBook as returned/i })).toBeTruthy();
    });

    it('commits the return only after the dialog accept callback fires', async () => {
      // Simulates the admin clicking "Continue" in the confirm dialog.
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      let acceptCallback: (() => void) | undefined;
      vi.spyOn(
        fixture.debugElement.injector.get(ConfirmationService),
        'confirm',
      ).mockImplementation((opts) => {
        acceptCallback = opts.accept as () => void;
      });

      triggerReturn(fixture, 'i-1', 'Damaged');
      // Dialog shown — item must still show its action buttons (still Pending)
      expect(screen.getByRole('button', { name: /Mark MacBook as returned/i })).toBeTruthy();

      // Admin clicks "Continue"
      acceptCallback?.();
      fixture.detectChanges();

      // Item is now Returned — return condition appears in DOM
      expect(screen.getByText(/Return condition: Damaged/i)).toBeTruthy();
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

      // Put i-1 into Issue with a note so canComplete() is true, but open issues remain.
      triggerConfirmIssue(fixture, 'i-1', 'Screen cracked');
      // Return i-2 so there are zero Pending items (completion gate is met).
      triggerReturn(fixture, 'i-2', 'Good');

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
      });

      triggerConfirmIssue(fixture, 'i-1', 'Screen cracked');
      triggerReturn(fixture, 'i-2', 'Good');

      triggerComplete(fixture);
      // Dialog shown but not confirmed — session should still be In progress
      expect(screen.queryByText(/Offboarding completed/i)).toBeNull();

      acceptCallback?.();
      fixture.detectChanges();
      expect(screen.getByText(/Offboarding completed/i)).toBeTruthy();
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

      triggerComplete(fixture);

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(screen.getByText(/Offboarding completed/i)).toBeTruthy();
    });
  });

  describe('complete flow (integration — real store + mocked repo)', () => {
    it('transitions Pending → all Returned → Completed and shows completed banner', async () => {
      const user = userEvent.setup();
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);

      // Wait for the resource to resolve and both item rows to appear.
      await waitFor(() => {
        expect(screen.getByRole('article', { name: 'MacBook' })).toBeTruthy();
        expect(screen.getByRole('article', { name: 'Monitor' })).toBeTruthy();
      });

      // While items are Pending the Complete button must be disabled.
      expect(
        (screen.getByRole('button', { name: /Complete offboarding/i }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      // Drive both items through the return path.
      // Good → Good: no condition-downgrade dialog fires, store is called directly.
      triggerReturn(fixture, 'i-1', 'Good');
      triggerReturn(fixture, 'i-2', 'Good');

      // All items Returned — Complete must now be enabled.
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /Complete offboarding/i });
        expect((btn as HTMLButtonElement).disabled).toBe(false);
      });

      // Click Complete — no open issues so no confirmation dialog fires.
      await user.click(screen.getByRole('button', { name: /Complete offboarding/i }));

      // Summary panel must switch to the completed banner.
      await waitFor(() => expect(screen.getByText(/Offboarding completed/i)).toBeTruthy());
    });
  });
});
