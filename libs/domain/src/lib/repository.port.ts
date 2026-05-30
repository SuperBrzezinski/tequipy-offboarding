import type { AssignedItem, Employee } from './types';

export interface IOffboardingRepository {
  getEmployees(): Promise<Employee[]>;
  getAssignedItems(employeeId: string): Promise<AssignedItem[]>;
}
