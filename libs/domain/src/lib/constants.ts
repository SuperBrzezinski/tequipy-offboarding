import type { ReturnCondition } from './types';

export const CONDITION_SEVERITY: Record<ReturnCondition, number> = {
  Good: 2,
  'Missing accessories': 1,
  Damaged: 0,
};
