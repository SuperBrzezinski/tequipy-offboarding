import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryOffboardingRepository } from './offboarding.repository';

describe('InMemoryOffboardingRepository', () => {
  let repo: InMemoryOffboardingRepository;

  beforeEach(() => {
    repo = new InMemoryOffboardingRepository();
  });

  // ---------------------------------------------------------------------------
  // Read queries
  // ---------------------------------------------------------------------------

  describe('getEmployees', () => {
    it('returns all 2 employees from the mock dataset', async () => {
      const employees = await repo.getEmployees();
      expect(employees).toHaveLength(2);
    });

    it('returns employees with correct names from the spec dataset', async () => {
      const employees = await repo.getEmployees();
      const names = employees.map((e) => e.name);
      expect(names).toContain('Maria Kowalski');
      expect(names).toContain('Tomasz Wierzbicki');
    });

    it('all employees start with In progress status', async () => {
      const employees = await repo.getEmployees();
      expect(employees.every((e) => e.offboardingStatus === 'In progress')).toBe(true);
    });

    it('returns a copy — mutations do not affect the source', async () => {
      const first = await repo.getEmployees();
      first.push({
        id: 'mutant',
        name: '',
        department: '',
        email: '',
        offboardingDate: '',
        offboardingStatus: 'In progress',
      });
      const second = await repo.getEmployees();
      expect(second).toHaveLength(2);
    });
  });

  describe('getEmployee', () => {
    it('returns the matching employee by id', async () => {
      const employee = await repo.getEmployee('emp-001');
      expect(employee).toBeDefined();
      expect(employee?.id).toBe('emp-001');
    });

    it('returns undefined for an unknown id', async () => {
      const employee = await repo.getEmployee('does-not-exist');
      expect(employee).toBeUndefined();
    });
  });

  describe('getAssignedItems', () => {
    it('returns items only for the requested employee', async () => {
      const items = await repo.getAssignedItems('emp-001');
      expect(items).toHaveLength(3);
      expect(items.every((i) => i.employeeId === 'emp-001')).toBe(true);
    });

    it('returns correct equipment IDs from the spec dataset', async () => {
      const items = await repo.getAssignedItems('emp-001');
      const ids = items.map((i) => i.id);
      expect(ids).toContain('eq-101');
      expect(ids).toContain('eq-102');
      expect(ids).toContain('eq-103');
    });

    it('all items start as Pending with empty note', async () => {
      const items = await repo.getAssignedItems('emp-001');
      expect(items.every((i) => i.status === 'Pending')).toBe(true);
      expect(items.every((i) => i.note === '')).toBe(true);
    });

    it('returns empty array for unknown employee id', async () => {
      const items = await repo.getAssignedItems('does-not-exist');
      expect(items).toHaveLength(0);
    });

    it('returns copies — mutating returned items does not corrupt future calls', async () => {
      const first = await repo.getAssignedItems('emp-001');
      (first[0] as unknown as Record<string, unknown>)['name'] = 'MUTATED';
      const second = await repo.getAssignedItems('emp-001');
      expect(second[0].name).not.toBe('MUTATED');
    });
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  describe('markItemReturned', () => {
    it('transitions Pending → Returned and records the condition', async () => {
      const updated = await repo.markItemReturned('emp-001', 'eq-101', 'Good');

      const item = updated.find((i) => i.id === 'eq-101');
      expect(item?.status).toBe('Returned');
      expect(item?.returnCondition).toBe('Good');
    });

    it('rejects when item id does not exist for employee', async () => {
      await expect(repo.markItemReturned('emp-001', 'does-not-exist', 'Good')).rejects.toThrow();
    });
  });

  describe('markItemIssue', () => {
    it('transitions Pending → Issue with a note', async () => {
      const updated = await repo.markItemIssue('emp-001', 'eq-101', 'Screen cracked');

      const item = updated.find((i) => i.id === 'eq-101');
      expect(item?.status).toBe('Issue');
      expect(item?.note).toBe('Screen cracked');
    });

    it('rejects when note is empty', async () => {
      await expect(repo.markItemIssue('emp-001', 'eq-101', '')).rejects.toThrow();
      await expect(repo.markItemIssue('emp-001', 'eq-101', '   ')).rejects.toThrow();
    });
  });

  describe('revertItem', () => {
    it('reverts Returned → Pending and clears returnCondition and note', async () => {
      await repo.markItemReturned('emp-001', 'eq-101', 'Damaged');
      const updated = await repo.revertItem('emp-001', 'eq-101');

      const item = updated.find((i) => i.id === 'eq-101');
      expect(item?.status).toBe('Pending');
      expect(item?.returnCondition).toBeUndefined();
      expect(item?.note).toBe('');
    });
  });

  describe('completeOffboarding', () => {
    it('returns a valid ISO completedAt string when all items are Returned', async () => {
      const assigned = await repo.getAssignedItems('emp-001');
      for (const item of assigned) {
        await repo.markItemReturned('emp-001', item.id, 'Good');
      }

      const completedAt = await repo.completeOffboarding('emp-001');

      expect(new Date(completedAt).toISOString()).toBe(completedAt);
    });

    it('updates getEmployee to reflect Completed status and completedAt', async () => {
      const assigned = await repo.getAssignedItems('emp-001');
      for (const item of assigned) {
        await repo.markItemReturned('emp-001', item.id, 'Good');
      }
      await repo.completeOffboarding('emp-001');

      const employee = await repo.getEmployee('emp-001');
      expect(employee?.offboardingStatus).toBe('Completed');
      expect(employee?.completedAt).toBeDefined();
    });

    it('getEmployees reflects Completed status after completion', async () => {
      const assigned = await repo.getAssignedItems('emp-001');
      for (const item of assigned) {
        await repo.markItemReturned('emp-001', item.id, 'Good');
      }
      await repo.completeOffboarding('emp-001');

      const employees = await repo.getEmployees();
      expect(employees.find((e) => e.id === 'emp-001')?.offboardingStatus).toBe('Completed');
    });

    it('throws when a Pending item still exists', async () => {
      await expect(repo.completeOffboarding('emp-001')).rejects.toThrow();
    });
  });
});
