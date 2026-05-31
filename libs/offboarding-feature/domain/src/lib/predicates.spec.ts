import { describe, expect, it } from 'vitest';
import { canComplete, hasOpenIssues } from './predicates';
import type { ReturnItem } from './types';

// Minimal test fixtures — only the fields under test matter.
function makeItem(status: ReturnItem['status'], note = ''): ReturnItem {
  return {
    item: {
      id: '1',
      employeeId: 'e1',
      name: 'Test item',
      type: 'Laptop',
      assignedCondition: 'Good',
    },
    status,
    note,
  };
}

describe('canComplete', () => {
  it('returns false for an empty list — nothing to complete', () => {
    expect(canComplete([])).toBe(false);
  });

  it('returns false when any item is still Pending', () => {
    expect(canComplete([makeItem('Pending'), makeItem('Returned')])).toBe(false);
  });

  it('returns false when all items are Pending', () => {
    expect(canComplete([makeItem('Pending'), makeItem('Pending')])).toBe(false);
  });

  it('returns false when an Issue item has an empty note', () => {
    expect(canComplete([makeItem('Issue', ''), makeItem('Returned')])).toBe(false);
  });

  it('returns false when an Issue note is whitespace-only', () => {
    expect(canComplete([makeItem('Issue', '   '), makeItem('Returned')])).toBe(false);
  });

  it('returns true when all items are Returned and there are no Issues', () => {
    expect(canComplete([makeItem('Returned'), makeItem('Returned')])).toBe(true);
  });

  it('returns true when all Issues have non-empty notes and no Pending remain', () => {
    expect(canComplete([makeItem('Issue', 'screen cracked'), makeItem('Returned')])).toBe(true);
  });

  it('returns true for a single Returned item', () => {
    expect(canComplete([makeItem('Returned')])).toBe(true);
  });
});

describe('hasOpenIssues', () => {
  it('returns false for an empty list', () => {
    expect(hasOpenIssues([])).toBe(false);
  });

  it('returns false when all items are Returned', () => {
    expect(hasOpenIssues([makeItem('Returned'), makeItem('Returned')])).toBe(false);
  });

  it('returns false when all items are Pending', () => {
    expect(hasOpenIssues([makeItem('Pending')])).toBe(false);
  });

  it('returns true when at least one item is in Issue state', () => {
    expect(hasOpenIssues([makeItem('Returned'), makeItem('Issue', 'damaged')])).toBe(true);
  });

  it('returns true when all items are Issues', () => {
    expect(hasOpenIssues([makeItem('Issue', 'a'), makeItem('Issue', 'b')])).toBe(true);
  });
});
