import { Injectable, InjectionToken } from '@angular/core';
import type {
  AssignedItem,
  Employee,
  IOffboardingRepository,
} from '@org/offboarding-feature/domain';
import { MOCK_ASSIGNED_ITEMS, MOCK_EMPLOYEES } from './mock-data';

@Injectable()
export class InMemoryOffboardingRepository implements IOffboardingRepository {
  getEmployees(): Promise<Employee[]> {
    return Promise.resolve([...MOCK_EMPLOYEES]);
  }

  getEmployee(id: string): Promise<Employee | undefined> {
    return Promise.resolve(MOCK_EMPLOYEES.find((employee) => employee.id === id));
  }

  getAssignedItems(employeeId: string): Promise<AssignedItem[]> {
    return Promise.resolve(
      MOCK_ASSIGNED_ITEMS.filter((item) => item.employeeId === employeeId).map((item) => ({
        ...item,
      })),
    );
  }
}

export const OFFBOARDING_REPO = new InjectionToken<IOffboardingRepository>('OFFBOARDING_REPO');
