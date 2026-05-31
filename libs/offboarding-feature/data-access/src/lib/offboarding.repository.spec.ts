import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryOffboardingRepository } from './offboarding.repository';

describe('InMemoryOffboardingRepository', () => {
  let repo: InMemoryOffboardingRepository;

  beforeEach(() => {
    repo = new InMemoryOffboardingRepository();
  });

  describe('getEmployees', () => {
    it('returns all 6 employees', async () => {
      const employees = await repo.getEmployees();
      expect(employees).toHaveLength(6);
    });

    it('includes one pre-completed employee', async () => {
      const employees = await repo.getEmployees();
      const completed = employees.filter((e) => e.offboardingStatus === 'Completed');
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('emp-006');
    });

    it('includes employees with In progress status', async () => {
      const employees = await repo.getEmployees();
      const active = employees.filter((e) => e.offboardingStatus === 'In progress');
      expect(active).toHaveLength(5);
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
      expect(second).toHaveLength(6);
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
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items.every((i) => i.employeeId === 'emp-001')).toBe(true);
    });

    it('returns empty array for employee with no equipment (emp-005)', async () => {
      const items = await repo.getAssignedItems('emp-005');
      expect(items).toHaveLength(0);
    });

    it('returns items for completed employee (emp-006)', async () => {
      const items = await repo.getAssignedItems('emp-006');
      expect(items.length).toBeGreaterThanOrEqual(2);
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
