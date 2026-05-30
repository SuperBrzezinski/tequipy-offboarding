import { describe, expect, it } from 'vitest';
import { assertNever } from './condition';
import { suggestNote } from './suggest-note';
import type { ReturnCondition } from './types';

const CONDITIONS: ReturnCondition[] = ['Good', 'Damaged', 'Missing accessories'];
const KNOWN_TYPES = ['Laptop', 'Monitor', 'Headset', 'Keyboard', 'Mouse', 'Docking Station'];

describe('suggestNote', () => {
  describe('known types — all condition combinations produce non-empty strings', () => {
    for (const type of KNOWN_TYPES) {
      for (const condition of CONDITIONS) {
        it(`${type} × ${condition}`, () => {
          const note = suggestNote(type, condition);
          expect(typeof note).toBe('string');
          expect(note.trim().length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('known types — notes are condition-specific (not all the same)', () => {
    it.each(KNOWN_TYPES)('%s: Good and Damaged notes differ', (type) => {
      expect(suggestNote(type, 'Good')).not.toBe(suggestNote(type, 'Damaged'));
    });
  });

  describe('content spot-checks — verifies map is wired, not just non-empty', () => {
    it('Laptop × Damaged mentions inspection', () => {
      expect(suggestNote('Laptop', 'Damaged')).toContain('inspect before reassignment');
    });

    it('Laptop × Missing accessories mentions accessories', () => {
      expect(suggestNote('Laptop', 'Missing accessories')).toContain('accessories');
    });

    it('Docking Station × Missing accessories mentions power adapter', () => {
      expect(suggestNote('Docking Station', 'Missing accessories')).toContain('power adapter');
    });
  });

  describe('unknown type — falls back gracefully', () => {
    it.each(CONDITIONS)('Unknown type × %s returns non-empty fallback', (condition) => {
      const note = suggestNote('UnknownGadget', condition);
      expect(note.trim().length).toBeGreaterThan(0);
    });

    it('empty string type falls back gracefully', () => {
      expect(suggestNote('', 'Good').trim().length).toBeGreaterThan(0);
    });
  });
});

describe('assertNever', () => {
  it('throws a readable error when called with an unexpected value at runtime', () => {
    // Simulates a value that escaped the type system (e.g. from a bad API response).
    expect(() => assertNever('unexpected' as never)).toThrowError('Unexpected value: unexpected');
  });
});
