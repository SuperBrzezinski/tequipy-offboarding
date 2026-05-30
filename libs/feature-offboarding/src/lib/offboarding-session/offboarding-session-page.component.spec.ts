import { provideRouter, Router } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { OFFBOARDING_REPO } from '@org/data-access';
import type { AssignedItem, Employee, IOffboardingRepository } from '@org/domain';
import { describe, expect, it, vi } from 'vitest';
import { OffboardingSessionPageComponent } from './offboarding-session-page.component';
import { OffboardingStore } from '../offboarding.store';

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
    providers: [provideRouter([]), { provide: OFFBOARDING_REPO, useValue: repo }],
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

  describe('suggest note (onSuggestNote)', () => {
    it('populates noteHints with a non-empty suggestion for the given item', async () => {
      const repo = makeRepo();
      const { fixture } = await renderPage(repo);
      await waitFor(() => screen.getByRole('article', { name: 'MacBook' }));

      const page = fixture.componentInstance as OffboardingSessionPageComponent;
      expect(page['noteHints']()['i-1']).toBeUndefined();

      page['onSuggestNote']('i-1');

      const hint = page['noteHints']()['i-1'];
      expect(hint).toBeTruthy();
      expect(typeof hint).toBe('string');
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
      ],
    });

    const backBtn = screen.getByRole('button', { name: /Back to employee list/i });
    await user.click(backBtn);

    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});

// ---------------------------------------------------------------------------
// Summary panel + completion flow — fresh OffboardingStore per test
// ---------------------------------------------------------------------------

/**
 * Renders the page with a scoped OffboardingStore so state from one test
 * cannot leak into another (the store is providedIn: 'root' by default, so
 * explicitly listing it here makes DI create a new instance per render).
 */
async function renderPageWithStore(repo: IOffboardingRepository, employeeId = 'emp-test') {
  return render(OffboardingSessionPageComponent, {
    inputs: { employeeId },
    providers: [provideRouter([]), { provide: OFFBOARDING_REPO, useValue: repo }, OffboardingStore],
  });
}

describe('Summary panel and completion flow', () => {
  it('summary counts update reactively when an item is returned', async () => {
    const repo = makeRepo();
    const { fixture } = await renderPageWithStore(repo);
    await waitFor(() => screen.getByRole('heading', { name: 'Jane Tester' }));

    const page = fixture.componentInstance as OffboardingSessionPageComponent;

    // Initially both items are Pending.
    expect(page['pendingCount']()).toBe(2);
    expect(page['returnedCount']()).toBe(0);

    // Mark i-1 as returned (beginReturn → confirmReturn).
    page['store'].beginReturn('emp-test', 'i-1');
    page['store'].confirmReturn('emp-test', 'i-1', 'Good');

    expect(page['returnedCount']()).toBe(1);
    expect(page['pendingCount']()).toBe(1);
  });

  it('completes without a dialog when there are no open issues', async () => {
    const repo = makeRepo();
    const { fixture } = await renderPageWithStore(repo);
    await waitFor(() => screen.getByRole('heading', { name: 'Jane Tester' }));

    const page = fixture.componentInstance as OffboardingSessionPageComponent;
    const confirmSpy = vi.spyOn(page['confirmationService'], 'confirm');

    // Return all items so canComplete is true with no issues.
    page['store'].beginReturn('emp-test', 'i-1');
    page['store'].confirmReturn('emp-test', 'i-1', 'Good');
    page['store'].beginReturn('emp-test', 'i-2');
    page['store'].confirmReturn('emp-test', 'i-2', 'Good');

    page['onComplete']();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(page['session']()?.offboardingStatus).toBe('Completed');
  });

  it('shows a dialog listing item names when there are open issues', async () => {
    const repo = makeRepo();
    const { fixture } = await renderPageWithStore(repo);
    await waitFor(() => screen.getByRole('heading', { name: 'Jane Tester' }));

    const page = fixture.componentInstance as OffboardingSessionPageComponent;
    const confirmSpy = vi.spyOn(page['confirmationService'], 'confirm');

    // Mark i-1 as Issue with a note, and i-2 as Returned.
    page['store'].beginIssue('emp-test', 'i-1');
    page['store'].confirmIssue('emp-test', 'i-1', 'Cracked screen');
    page['store'].beginReturn('emp-test', 'i-2');
    page['store'].confirmReturn('emp-test', 'i-2', 'Good');

    page['onComplete']();

    expect(confirmSpy).toHaveBeenCalledOnce();
    const call = confirmSpy.mock.calls[0][0];
    expect(call.message).toContain('MacBook');
    expect(call.message).toContain('Cracked screen');
  });

  it('pendingReason shows pending count when items are still Pending', async () => {
    const repo = makeRepo();
    const { fixture } = await renderPageWithStore(repo);
    await waitFor(() => screen.getByRole('heading', { name: 'Jane Tester' }));
    const page = fixture.componentInstance as OffboardingSessionPageComponent;
    // Both items Pending by default
    expect(page['pendingReason']()).toBe('2 items still pending');
  });

  it('pendingReason shows 1 item still pending when one is returned and one is pending', async () => {
    const repo = makeRepo();
    const { fixture } = await renderPageWithStore(repo);
    await waitFor(() => screen.getByRole('heading', { name: 'Jane Tester' }));
    const page = fixture.componentInstance as OffboardingSessionPageComponent;
    page['store'].beginReturn('emp-test', 'i-1');
    page['store'].confirmReturn('emp-test', 'i-1', 'Good');
    expect(page['pendingReason']()).toBe('1 item still pending');
  });

  it('marks items as read-only after the session is completed', async () => {
    const repo = makeRepo();
    const { fixture } = await renderPageWithStore(repo);
    await waitFor(() => screen.getByRole('heading', { name: 'Jane Tester' }));

    const page = fixture.componentInstance as OffboardingSessionPageComponent;

    // Complete via store directly (all items are Pending → need to return them first).
    page['store'].beginReturn('emp-test', 'i-1');
    page['store'].confirmReturn('emp-test', 'i-1', 'Good');
    page['store'].beginReturn('emp-test', 'i-2');
    page['store'].confirmReturn('emp-test', 'i-2', 'Good');
    page['store'].completeOffboarding('emp-test');

    expect(page['isCompleted']()).toBe(true);
  });
});
