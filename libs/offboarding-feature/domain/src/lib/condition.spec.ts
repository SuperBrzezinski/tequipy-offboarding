import { describe, expect, it } from 'vitest';
import { isConditionWorse } from './condition';
import type { ReturnCondition } from './types';

describe('isConditionWorse', () => {
  // The severity order: Good (2) > Missing accessories (1) > Damaged (0).
  // "Worse" means the returned severity is strictly lower than assigned.

  const conditions: ReturnCondition[] = ['Good', 'Missing accessories', 'Damaged'];

  describe('same condition — never worse', () => {
    it.each(conditions)('%s → same = false', (c) => {
      expect(isConditionWorse(c, c)).toBe(false);
    });
  });

  describe('returned is strictly worse', () => {
    it('Good → Damaged = true', () => {
      expect(isConditionWorse('Good', 'Damaged')).toBe(true);
    });

    it('Good → Missing accessories = true', () => {
      expect(isConditionWorse('Good', 'Missing accessories')).toBe(true);
    });

    it('Missing accessories → Damaged = true', () => {
      expect(isConditionWorse('Missing accessories', 'Damaged')).toBe(true);
    });
  });

  describe('returned is same or better — not worse', () => {
    it('Damaged → Good = false (improvement)', () => {
      expect(isConditionWorse('Damaged', 'Good')).toBe(false);
    });

    it('Damaged → Missing accessories = false (improvement)', () => {
      expect(isConditionWorse('Damaged', 'Missing accessories')).toBe(false);
    });

    it('Missing accessories → Good = false (improvement)', () => {
      expect(isConditionWorse('Missing accessories', 'Good')).toBe(false);
    });
  });
});
