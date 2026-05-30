import { render, screen } from '@testing-library/angular';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { describe, expect, it } from 'vitest';
import { ConditionDiffBadgeComponent } from './condition-diff-badge.component';

const providers = [providePrimeNG({ theme: { preset: Aura } })];

describe('ConditionDiffBadgeComponent', () => {
  it('renders nothing when assignedCondition equals returnCondition', async () => {
    await render(ConditionDiffBadgeComponent, {
      inputs: { assignedCondition: 'Good', returnCondition: 'Good' },
      providers,
    });

    // No tag at all when conditions match — no diff to show.
    expect(document.querySelector('[data-severity]')).toBeNull();
  });

  it('renders a warn tag when returnCondition is worse (Good → Damaged)', async () => {
    await render(ConditionDiffBadgeComponent, {
      inputs: { assignedCondition: 'Good', returnCondition: 'Damaged' },
      providers,
    });

    expect(screen.getByText('Was: Good → Now: Damaged')).toBeTruthy();
    // data-severity is set by the component — stable contract independent of PrimeNG CSS internals.
    expect(document.querySelector('[data-severity="warn"]')).not.toBeNull();
  });

  it('renders a warn tag when returnCondition is worse (Good → Missing accessories)', async () => {
    await render(ConditionDiffBadgeComponent, {
      inputs: { assignedCondition: 'Good', returnCondition: 'Missing accessories' },
      providers,
    });

    expect(screen.getByText('Was: Good → Now: Missing accessories')).toBeTruthy();
    expect(document.querySelector('[data-severity="warn"]')).not.toBeNull();
  });

  it('renders a default tag (no warn) when conditions differ but returnCondition is not worse', async () => {
    await render(ConditionDiffBadgeComponent, {
      inputs: { assignedCondition: 'Damaged', returnCondition: 'Good' },
      providers,
    });

    expect(screen.getByText('Was: Damaged → Now: Good')).toBeTruthy();
    // Condition improved — should use default severity, not warn.
    expect(document.querySelector('[data-severity="warn"]')).toBeNull();
    expect(document.querySelector('[data-severity="default"]')).not.toBeNull();
  });
});
