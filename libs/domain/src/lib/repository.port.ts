import type { AssignedItem, Employee } from './types';

export interface IOffboardingRepository {
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getAssignedItems(employeeId: string): Promise<AssignedItem[]>;
}
