import type { AssignedItem, Employee, ReturnCondition, ReturnItem } from './types';

export interface IOffboardingRepository {
  // Reads
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getAssignedItems(employeeId: string): Promise<AssignedItem[]>;
  getSessionItems(employeeId: string): Promise<ReturnItem[] | null>;

  // Writes — mirror the HTTP mutations a real backend would expose
  initSession(employeeId: string, items: AssignedItem[]): Promise<void>;
  markItemReturned(
    employeeId: string,
    itemId: string,
    condition: ReturnCondition,
  ): Promise<ReturnItem[]>;
  markItemIssue(employeeId: string, itemId: string, note: string): Promise<ReturnItem[]>;
  revertItem(employeeId: string, itemId: string): Promise<ReturnItem[]>;
  completeOffboarding(employeeId: string): Promise<string>;
}
