import { CONDITION_SEVERITY } from './constants';
import type { ReturnCondition } from './types';

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}

export function isConditionWorse(assigned: ReturnCondition, returned: ReturnCondition): boolean {
  return CONDITION_SEVERITY[returned] < CONDITION_SEVERITY[assigned];
}
