import type { AssignedItem, Employee, ReturnCondition } from './types';

export interface IOffboardingRepository {
  // Reads
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getAssignedItems(employeeId: string): Promise<AssignedItem[]>;

  // Writes — mirror the HTTP mutations a real backend would expose
  markItemReturned(
    employeeId: string,
    itemId: string,
    condition: ReturnCondition,
  ): Promise<AssignedItem[]>;
  markItemIssue(employeeId: string, itemId: string, note: string): Promise<AssignedItem[]>;
  revertItem(employeeId: string, itemId: string): Promise<AssignedItem[]>;
  completeOffboarding(employeeId: string): Promise<string>;
}
