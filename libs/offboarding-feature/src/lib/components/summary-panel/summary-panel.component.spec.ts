import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { describe, expect, it, vi } from 'vitest';
import { SummaryPanelComponent } from './summary-panel.component';

const primeNGProviders = [providePrimeNG({ theme: { preset: Aura } })];

describe('SummaryPanelComponent — active state', () => {
  it('renders count chips with correct numbers', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 3,
        returnedCount: 5,
        issueCount: 1,
        canComplete: false,
        offboardingStatus: 'In progress',
      },
      providers: primeNGProviders,
    });

    // Chips expose counts in accessible aria-labels and as visible text.
    expect(screen.getByRole('listitem', { name: /pending: 3/i })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: /returned: 5/i })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: /issue: 1/i })).toBeTruthy();
  });

  it('"Complete offboarding" button is disabled when canComplete is false', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 2,
        returnedCount: 0,
        issueCount: 0,
        canComplete: false,
        offboardingStatus: 'In progress',
      },
      providers: primeNGProviders,
    });

    const btn = screen.getByRole('button', { name: /complete offboarding/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('"Complete offboarding" button is enabled when canComplete is true', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 0,
        returnedCount: 4,
        issueCount: 0,
        canComplete: true,
        offboardingStatus: 'In progress',
      },
      providers: primeNGProviders,
    });

    const btn = screen.getByRole('button', { name: /complete offboarding/i });
    expect(btn.hasAttribute('disabled')).toBe(false);
  });

  it('emits complete when the enabled button is clicked', async () => {
    const user = userEvent.setup();
    const completeFn = vi.fn();

    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 0,
        returnedCount: 4,
        issueCount: 0,
        canComplete: true,
        offboardingStatus: 'In progress',
      },
      on: { complete: completeFn },
      providers: primeNGProviders,
    });

    await user.click(screen.getByRole('button', { name: /complete offboarding/i }));
    expect(completeFn).toHaveBeenCalledOnce();
  });

  it('shows pendingReason text when canComplete is false and pendingReason is provided', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 2,
        returnedCount: 0,
        issueCount: 0,
        canComplete: false,
        pendingReason: '2 items still pending',
        offboardingStatus: 'In progress',
      },
      providers: primeNGProviders,
    });

    expect(screen.getByText(/2 items still pending/i)).toBeTruthy();
  });

  it('does not show pendingReason when canComplete is false but pendingReason is null', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 1,
        returnedCount: 0,
        issueCount: 0,
        canComplete: false,
        pendingReason: null,
        offboardingStatus: 'In progress',
      },
      providers: primeNGProviders,
    });

    // The reason paragraph should be absent entirely when no reason is supplied.
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('SummaryPanelComponent — completed state', () => {
  it('shows "Offboarding completed" heading', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 0,
        returnedCount: 4,
        issueCount: 0,
        canComplete: false,
        offboardingStatus: 'Completed',
        completedAt: '2026-05-30T14:30:00.000Z',
      },
      providers: primeNGProviders,
    });

    expect(screen.getByRole('heading', { name: /offboarding completed/i })).toBeTruthy();
  });

  it('does not render "Complete offboarding" button in completed state', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 0,
        returnedCount: 4,
        issueCount: 0,
        canComplete: false,
        offboardingStatus: 'Completed',
        completedAt: '2026-05-30T14:30:00.000Z',
      },
      providers: primeNGProviders,
    });

    expect(screen.queryByRole('button', { name: /complete offboarding/i })).toBeNull();
  });

  it('renders a formatted timestamp when completedAt is provided', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 0,
        returnedCount: 4,
        issueCount: 0,
        canComplete: false,
        offboardingStatus: 'Completed',
        completedAt: '2026-05-30T14:30:00.000Z',
      },
      providers: primeNGProviders,
    });

    // The formatDate helper uses en-GB locale which produces "30 May 2026, 14:30".
    // We match a subset that is robust to minor locale/timezone differences.
    const time = screen.getByRole('time' as never);
    expect(time.textContent).toMatch(/may/i);
    expect(time.textContent).toMatch(/2026/);
  });

  it('shows "—" when completedAt is null', async () => {
    await render(SummaryPanelComponent, {
      inputs: {
        pendingCount: 0,
        returnedCount: 4,
        issueCount: 0,
        canComplete: false,
        offboardingStatus: 'Completed',
        completedAt: null,
      },
      providers: primeNGProviders,
    });

    // Fallback dash must be visible when no timestamp is available.
    expect(screen.getByText('—')).toBeTruthy();
  });
});
