import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryOffboardingRepository } from './offboarding.repository';

describe('InMemoryOffboardingRepository', () => {
  let repo: InMemoryOffboardingRepository;

  beforeEach(() => {
    repo = new InMemoryOffboardingRepository();
  });

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

    it('returns empty array for unknown employee id', async () => {
      const items = await repo.getAssignedItems('does-not-exist');
      expect(items).toHaveLength(0);
    });

    it('returns copies — mutating returned items does not corrupt future calls', async () => {
      const first = await repo.getAssignedItems('emp-001');
      (first[0] as Record<string, unknown>)['name'] = 'MUTATED';
      const second = await repo.getAssignedItems('emp-001');
      expect(second[0].name).not.toBe('MUTATED');
    });
  });
});
