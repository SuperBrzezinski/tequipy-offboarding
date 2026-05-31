import { Provider, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { OFFBOARDING_REPO, OffboardingStore } from '@org/offboarding-feature/data-access';
import type {
  AssignedItem,
  Employee,
  IOffboardingRepository,
} from '@org/offboarding-feature/domain';
import { describe, expect, it, vi } from 'vitest';
import { EmployeeListPageComponent } from './employee-list-page.component';

const EMPLOYEES: Employee[] = [
  {
    id: 'emp-a',
    name: 'Alice Active',
    department: 'Eng',
    email: 'a@t.com',
    offboardingDate: '2026-06-01',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-b',
    name: 'Bob Completed',
    department: 'Design',
    email: 'b@t.com',
    offboardingDate: '2026-05-15',
    offboardingStatus: 'Completed',
  },
];

function makeRepo(overrides: Partial<IOffboardingRepository> = {}): IOffboardingRepository {
  return {
    getEmployees: vi.fn().mockResolvedValue(EMPLOYEES),
    getEmployee: vi.fn().mockResolvedValue(undefined),
    getAssignedItems: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function renderList(repo: IOffboardingRepository, extraProviders: Provider[] = []) {
  return render(EmployeeListPageComponent, {
    providers: [
      provideRouter([]),
      { provide: OFFBOARDING_REPO, useValue: repo },
      OffboardingStore,
      ...extraProviders,
    ],
  });
}

describe('EmployeeListPageComponent', () => {
  it('renders all employees returned by the repository', async () => {
    await renderList(makeRepo());

    await waitFor(() => expect(screen.getByText('Alice Active')).toBeTruthy());
    expect(screen.getByText('Bob Completed')).toBeTruthy();
  });

  it('shows Completed badge for pre-completed employees', async () => {
    await renderList(makeRepo());

    await waitFor(() => expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1));
  });

  it('shows In progress badge for active employees', async () => {
    await renderList(makeRepo());

    await waitFor(() =>
      expect(screen.getAllByText('In progress').length).toBeGreaterThanOrEqual(1),
    );
  });

  it('navigates to /offboarding/:id when an employee row is clicked', async () => {
    const navigate = vi.fn();
    const user = userEvent.setup();

    await renderList(makeRepo(), [{ provide: Router, useValue: { navigate } }]);

    await waitFor(() => expect(screen.getByText('Alice Active')).toBeTruthy());
    await user.click(screen.getByText('Alice Active'));

    expect(navigate).toHaveBeenCalledWith(['/offboarding', 'emp-a']);
  });

  it('shows error state when repository throws', async () => {
    await renderList(
      makeRepo({ getEmployees: vi.fn().mockRejectedValue(new Error('network error')) }),
    );

    await waitFor(() => expect(screen.getByText(/Failed to load employees/i)).toBeTruthy());
  });

  it('shows empty state when repository returns no employees', async () => {
    await renderList(makeRepo({ getEmployees: vi.fn().mockResolvedValue([]) }));

    await waitFor(() => expect(screen.getByText(/No employees to offboard/i)).toBeTruthy());
  });

  it('reflects store-completed session as Completed on the list (regression)', async () => {
    // Regression: completeOffboarding() updates only the OffboardingStore, not the repo.
    // After the session page completes and the admin navigates back, the list must read
    // the store's completedEmployeeIds to override the stale repo status.
    //
    // The list component uses only `store.completedEmployeeIds()`, so we provide a
    // minimal fake store with emp-a pre-marked as completed. The repo still reports
    // Alice as 'In progress' — the component must override it with 'Completed'.
    const completedIds = signal(new Set<string>(['emp-a']));

    await render(EmployeeListPageComponent, {
      providers: [
        provideRouter([]),
        { provide: OFFBOARDING_REPO, useValue: makeRepo() },
        { provide: OffboardingStore, useValue: { completedEmployeeIds: completedIds } },
      ],
    });

    // Both Alice (completed via store) and Bob (pre-completed in repo) must show Completed.
    await waitFor(() => expect(screen.getAllByText('Completed').length).toBe(2));
    expect(screen.queryByText('In progress')).toBeNull();
  });

  it('renders column headers for Name, Department, Offboarding Date and Status', async () => {
    await renderList(makeRepo());

    // columnheader role is implicit on <th scope="col"> elements
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /^Name/i })).toBeTruthy();
      expect(screen.getByRole('columnheader', { name: /^Department/i })).toBeTruthy();
      expect(screen.getByRole('columnheader', { name: /^Offboarding Date/i })).toBeTruthy();
      expect(screen.getByRole('columnheader', { name: /^Status/i })).toBeTruthy();
    });
  });
});
