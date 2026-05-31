import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { ReturnItem } from '@org/offboarding-feature/domain';
import { describe, expect, it, vi } from 'vitest';
import { EquipmentRowComponent } from './equipment-row.component';
import { EquipmentListComponent } from '../equipment-list/equipment-list.component';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

const primeNGProviders = [providePrimeNG({ theme: { preset: Aura } })];

function makePendingItem(overrides: Partial<ReturnItem> = {}): ReturnItem {
  return {
    item: {
      id: 'item-1',
      employeeId: 'emp-1',
      name: 'MacBook Pro',
      type: 'Laptop',
      serialNumber: 'SN-12345',
      assignedCondition: 'Good',
    },
    status: 'Pending',
    note: '',
    ...overrides,
  };
}

function makeReturnedItem(): ReturnItem {
  return {
    item: {
      id: 'item-2',
      employeeId: 'emp-1',
      name: 'Dell Monitor',
      type: 'Monitor',
      assignedCondition: 'Good',
    },
    status: 'Returned',
    returnCondition: 'Good',
    note: '',
  };
}

function makeIssueItem(): ReturnItem {
  return {
    item: {
      id: 'item-3',
      employeeId: 'emp-1',
      name: 'Keyboard',
      type: 'Peripheral',
      assignedCondition: 'Good',
    },
    status: 'Issue',
    note: 'Key is missing',
  };
}

describe('EquipmentRowComponent', () => {
  it('renders item name for a Pending item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem() },
      providers: primeNGProviders,
    });

    expect(screen.getByText('MacBook Pro')).toBeTruthy();
  });

  it('shows "Mark as returned" and "Report issue" buttons for Pending item (not editing)', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: false },
      providers: primeNGProviders,
    });

    // aria-label is "Mark {name} as returned" — match partial
    expect(screen.getByRole('button', { name: /mark.*as returned/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /report issue for/i })).toBeTruthy();
  });

  it('does NOT show StatusBadge for Pending item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: false },
      providers: primeNGProviders,
    });

    // Status badge is a lib-status-badge which renders a p-tag with the status as value.
    // For Pending, we show action buttons instead — no p-tag status badge is rendered.
    // The type tag (e.g. "Laptop") is present but the word "Pending" should not appear.
    expect(screen.queryByText('Pending')).toBeNull();
  });

  it('shows condition select when isEditing=true and editMode="return"', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'return' },
      providers: primeNGProviders,
    });

    expect(screen.getByText(/return condition/i)).toBeTruthy();
  });

  it('"Confirm return" button is disabled when no condition is selected', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'return' },
      providers: primeNGProviders,
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm return of/i });
    // PrimeNG sets the disabled attribute on the native button
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('shows textarea when isEditing=true and editMode="issue"', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'issue' },
      providers: primeNGProviders,
    });

    expect(screen.getByPlaceholderText(/describe the issue/i)).toBeTruthy();
  });

  it('"Confirm issue" is disabled when note is empty', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'issue' },
      providers: primeNGProviders,
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm issue for/i });
    // PrimeNG sets the disabled attribute on the native button
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('renders "Undo return" button for a Returned item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makeReturnedItem() },
      providers: primeNGProviders,
    });

    expect(screen.getByRole('button', { name: /undo return of/i })).toBeTruthy();
  });

  it('shows StatusBadge with "Returned" for a Returned item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makeReturnedItem() },
      providers: primeNGProviders,
    });

    expect(screen.getByText('Returned')).toBeTruthy();
  });

  it('renders note text for an Issue item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makeIssueItem() },
      providers: primeNGProviders,
    });

    expect(screen.getByText(/key is missing/i)).toBeTruthy();
  });

  it('shows StatusBadge with "Issue" for an Issue item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makeIssueItem() },
      providers: primeNGProviders,
    });

    expect(screen.getByText('Issue')).toBeTruthy();
  });

  it('does not show action buttons for an Issue item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makeIssueItem() },
      providers: primeNGProviders,
    });

    expect(screen.queryByRole('button', { name: /mark.*as returned/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /report issue for/i })).toBeNull();
  });

  it('emits suggestNote with itemId when "Suggest note" is clicked', async () => {
    const user = userEvent.setup();
    const suggestNoteFn = vi.fn();

    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'issue' },
      on: { suggestNote: suggestNoteFn },
      providers: primeNGProviders,
    });

    const btn = screen.getByRole('button', { name: /suggest a note for/i });
    await user.click(btn);

    expect(suggestNoteFn).toHaveBeenCalledWith('item-1');
  });

  it('emits beginReturn with itemId when "Mark as returned" is clicked', async () => {
    const user = userEvent.setup();
    const beginReturnFn = vi.fn();

    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: false },
      on: { beginReturn: beginReturnFn },
      providers: primeNGProviders,
    });

    await user.click(screen.getByRole('button', { name: /mark.*as returned/i }));
    expect(beginReturnFn).toHaveBeenCalledWith('item-1');
  });

  it('emits beginIssue with itemId when "Report issue" is clicked', async () => {
    const user = userEvent.setup();
    const beginIssueFn = vi.fn();

    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: false },
      on: { beginIssue: beginIssueFn },
      providers: primeNGProviders,
    });

    await user.click(screen.getByRole('button', { name: /report issue for/i }));
    expect(beginIssueFn).toHaveBeenCalledWith('item-1');
  });

  it('clears selectedCondition and noteValue when isEditing flips to false', async () => {
    const { fixture } = await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'return' },
      providers: primeNGProviders,
    });

    // Simulate in-progress state before the parent closes the edit
    fixture.componentInstance['selectedCondition'].set('Good');
    fixture.componentInstance['noteValue'].set('some note');
    fixture.detectChanges();

    // Parent closes the edit panel
    fixture.componentRef.setInput('isEditing', false);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance['selectedCondition']()).toBeNull();
    expect(fixture.componentInstance['noteValue']()).toBe('');
  });

  it('emits confirmReturn with itemId and condition when "Confirm return" is clicked after selecting a condition', async () => {
    const confirmReturnFn = vi.fn();

    const { fixture, getByRole } = await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'return' },
      on: { confirmReturn: confirmReturnFn },
      providers: primeNGProviders,
    });

    // Directly set the internal selectedCondition signal (bypasses PrimeNG select interaction)
    fixture.componentInstance['selectedCondition'].set('Good');
    fixture.detectChanges();
    await fixture.whenStable();

    const confirmBtn = getByRole('button', { name: /confirm return of/i });
    confirmBtn.click();
    await fixture.whenStable();

    expect(confirmReturnFn).toHaveBeenCalledWith({ itemId: 'item-1', condition: 'Good' });
  });

  it('emits confirmIssue with trimmed note when "Confirm issue" is clicked', async () => {
    const confirmIssueFn = vi.fn();

    const { fixture, getByRole } = await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'issue' },
      on: { confirmIssue: confirmIssueFn },
      providers: primeNGProviders,
    });

    // Set note with surrounding whitespace — the handler must trim before emitting
    fixture.componentInstance['noteValue'].set('  screen cracked  ');
    fixture.detectChanges();

    const confirmBtn = getByRole('button', { name: /confirm issue for/i });
    confirmBtn.click();
    await fixture.whenStable();

    expect(confirmIssueFn).toHaveBeenCalledWith({ itemId: 'item-1', note: 'screen cracked' });
  });
});

describe('suggestedNote input', () => {
  it('pre-fills the noteValue textarea when suggestedNote input is set', async () => {
    // The smart page passes a domain-generated suggestion; the row effect must
    // populate the textarea so the admin can edit it before confirming.
    const { fixture } = await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), isEditing: true, editMode: 'issue', suggestedNote: null },
      providers: primeNGProviders,
    });

    // Initially no suggestion — textarea should be empty
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea?.value ?? '').toBe('');

    // Smart page sends a suggestion
    fixture.componentRef.setInput('suggestedNote', 'Charger cable missing');
    await fixture.whenStable();

    expect(fixture.componentInstance['noteValue']()).toBe('Charger cable missing');
  });
});

describe('readOnly mode', () => {
  it('shows action buttons when readOnly is false (default) for a Pending item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), readOnly: false },
      providers: primeNGProviders,
    });

    expect(screen.getByRole('button', { name: /mark.*as returned/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /report issue for/i })).toBeTruthy();
  });

  it('hides all action buttons but keeps item name visible when readOnly is true for a Pending item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makePendingItem(), readOnly: true },
      providers: primeNGProviders,
    });

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('MacBook Pro')).toBeTruthy();
  });

  it('hides "Undo return" button but keeps item name visible when readOnly is true for a Returned item', async () => {
    await render(EquipmentRowComponent, {
      inputs: { item: makeReturnedItem(), readOnly: true },
      providers: primeNGProviders,
    });

    expect(screen.queryByRole('button', { name: /undo return of/i })).toBeNull();
    expect(screen.getByText('Dell Monitor')).toBeTruthy();
  });
});

describe('EquipmentListComponent — empty state', () => {
  it('renders empty-state message when items=[]', async () => {
    await render(EquipmentListComponent, {
      inputs: { items: [] },
      providers: primeNGProviders,
    });

    expect(screen.getByText(/no equipment assigned to this employee/i)).toBeTruthy();
  });

  it('renders one row per item when items are provided', async () => {
    const items: ReturnItem[] = [makePendingItem(), makeReturnedItem()];

    await render(EquipmentListComponent, {
      inputs: { items },
      providers: primeNGProviders,
    });

    expect(screen.getByText('MacBook Pro')).toBeTruthy();
    expect(screen.getByText('Dell Monitor')).toBeTruthy();
  });
});
