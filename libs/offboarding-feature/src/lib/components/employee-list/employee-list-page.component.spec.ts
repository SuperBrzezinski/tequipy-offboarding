import { Provider } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { OFFBOARDING_REPO } from '@org/offboarding-feature/data-access';
import type { Employee, IOffboardingRepository } from '@org/offboarding-feature/domain';
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
    markItemReturned: vi.fn().mockResolvedValue([]),
    markItemIssue: vi.fn().mockResolvedValue([]),
    revertItem: vi.fn().mockResolvedValue([]),
    completeOffboarding: vi.fn().mockResolvedValue(new Date().toISOString()),
    ...overrides,
  };
}

function renderList(repo: IOffboardingRepository, extraProviders: Provider[] = []) {
  return render(EmployeeListPageComponent, {
    providers: [
      provideRouter([]),
      { provide: OFFBOARDING_REPO, useValue: repo },
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
