import { provideRouter, Router } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmationService } from 'primeng/api';
import { OFFBOARDING_REPO, OffboardingStore } from '@org/offboarding-feature/data-access';
import type {
  AssignedItem,
  Employee,
  IOffboardingRepository,
} from '@org/offboarding-feature/domain';
import { describe, expect, it, vi } from 'vitest';
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
    it('calls store.confirmReturn directly when condition is not a downgrade', async () => {
      // Good → Good: severity stays the same, no dialog needed.
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      const confirmSpy = vi.spyOn(page['confirmationService'], 'confirm');

      // MacBook (i-1) assignedCondition = 'Good'; returning as 'Good' = no downgrade
      page['onConfirmReturn']({ itemId: 'i-1', condition: 'Good' });

      expect(confirmSpy).not.toHaveBeenCalled();
      // Session item should now be Returned
      const sess = page['session']();
      expect(sess?.items.find((r) => r.item.id === 'i-1')?.status).toBe('Returned');
    });

    it('shows ConfirmDialog when recording a worse condition', async () => {
      // Good → Damaged: downgrade detected, dialog must appear before committing.
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      const confirmSpy = vi.spyOn(page['confirmationService'], 'confirm');

      page['onConfirmReturn']({ itemId: 'i-1', condition: 'Damaged' });

      expect(confirmSpy).toHaveBeenCalledOnce();
      const call = confirmSpy.mock.calls[0][0];
      expect(call.message).toContain('MacBook');
      expect(call.message).toContain('Good');
      expect(call.message).toContain('Damaged');
      // Item must NOT be committed yet — dialog awaits confirmation
      const sess = page['session']();
      expect(sess?.items.find((r) => r.item.id === 'i-1')?.status).toBe('Pending');
    });

    it('commits the return only after the dialog accept callback fires', async () => {
      // Simulates the admin clicking "Continue" in the confirm dialog.
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      let acceptCallback: (() => void) | undefined;
      vi.spyOn(page['confirmationService'], 'confirm').mockImplementation((opts) => {
        acceptCallback = opts.accept as () => void;
      });

      page['onConfirmReturn']({ itemId: 'i-1', condition: 'Damaged' });
      expect(page['session']()?.items.find((r) => r.item.id === 'i-1')?.status).toBe('Pending');

      // Admin clicks "Continue"
      acceptCallback?.();
      expect(page['session']()?.items.find((r) => r.item.id === 'i-1')?.status).toBe('Returned');
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

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      const confirmSpy = vi.spyOn(page['confirmationService'], 'confirm');

      // Put i-1 into Issue status with a note so canComplete() returns true,
      // but sessionHasOpenIssues() is true → dialog must fire.
      page['onBeginIssue']('i-1');
      page['onConfirmIssue']({ itemId: 'i-1', note: 'Screen cracked' });
      // Return i-2 so there are zero Pending items (completion gate is met).
      page['onConfirmReturn']({ itemId: 'i-2', condition: 'Good' });
      fixture.detectChanges();

      page['onComplete']();

      expect(confirmSpy).toHaveBeenCalledOnce();
      const call = confirmSpy.mock.calls[0][0];
      expect(call.header).toBe('Unresolved issues');
      expect(call.message).toContain('MacBook');
      expect(call.message).toContain('Screen cracked');
    });

    it('calls store.completeOffboarding only after the dialog accept callback fires', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      let acceptCallback: (() => void) | undefined;
      vi.spyOn(page['confirmationService'], 'confirm').mockImplementation((opts) => {
        acceptCallback = opts.accept as () => void;
      });

      page['onBeginIssue']('i-1');
      page['onConfirmIssue']({ itemId: 'i-1', note: 'Screen cracked' });
      page['onConfirmReturn']({ itemId: 'i-2', condition: 'Good' });

      page['onComplete']();
      // Dialog shown but not confirmed yet — session should still be In progress.
      expect(page['session']()?.offboardingStatus).toBe('In progress');

      acceptCallback?.();
      expect(page['session']()?.offboardingStatus).toBe('Completed');
    });

    it('does NOT show ConfirmDialog when all items are Returned (no open issues)', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      const confirmSpy = vi.spyOn(page['confirmationService'], 'confirm');

      page['onConfirmReturn']({ itemId: 'i-1', condition: 'Good' });
      page['onConfirmReturn']({ itemId: 'i-2', condition: 'Good' });

      page['onComplete']();

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(page['session']()?.offboardingStatus).toBe('Completed');
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
      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      page['onConfirmReturn']({ itemId: 'i-1', condition: 'Good' });
      page['onConfirmReturn']({ itemId: 'i-2', condition: 'Good' });
      fixture.detectChanges();

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
