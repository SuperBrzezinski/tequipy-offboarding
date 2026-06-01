import { Injectable, InjectionToken } from '@angular/core';
import type {
  AssignedItem,
  Employee,
  IOffboardingRepository,
  ReturnCondition,
} from '@org/offboarding-feature/domain';
import { canComplete } from '@org/offboarding-feature/domain';
import { MOCK_ASSIGNED_ITEMS, MOCK_EMPLOYEES } from './mock-data';

@Injectable()
export class InMemoryOffboardingRepository implements IOffboardingRepository {
  private readonly _employees: Employee[] = MOCK_EMPLOYEES.map((e) => ({ ...e }));
  private readonly _items: AssignedItem[] = MOCK_ASSIGNED_ITEMS.map((i) => ({ ...i }));

  getEmployees(): Promise<Employee[]> {
    return Promise.resolve(this._employees.map((e) => ({ ...e })));
  }

  getEmployee(id: string): Promise<Employee | undefined> {
    const employee = this._employees.find((e) => e.id === id);
    return Promise.resolve(employee ? { ...employee } : undefined);
  }

  getAssignedItems(employeeId: string): Promise<AssignedItem[]> {
    return Promise.resolve(
      this._items.filter((item) => item.employeeId === employeeId).map((item) => ({ ...item })),
    );
  }

  markItemReturned(
    employeeId: string,
    itemId: string,
    condition: ReturnCondition,
  ): Promise<AssignedItem[]> {
    const index = this._items.findIndex((i) => i.id === itemId && i.employeeId === employeeId);
    if (index === -1) {
      return Promise.reject(new Error(`Item ${itemId} not found for employee ${employeeId}.`));
    }
    this._items[index] = {
      ...this._items[index],
      status: 'Returned',
      returnCondition: condition,
    };
    return Promise.resolve(this._itemsForEmployee(employeeId));
  }

  markItemIssue(employeeId: string, itemId: string, note: string): Promise<AssignedItem[]> {
    if (!note.trim()) {
      return Promise.reject(new Error(`markItemIssue: note must not be empty for item ${itemId}.`));
    }
    const index = this._items.findIndex((i) => i.id === itemId && i.employeeId === employeeId);
    if (index === -1) {
      return Promise.reject(new Error(`Item ${itemId} not found for employee ${employeeId}.`));
    }
    this._items[index] = { ...this._items[index], status: 'Issue', note };
    return Promise.resolve(this._itemsForEmployee(employeeId));
  }

  revertItem(employeeId: string, itemId: string): Promise<AssignedItem[]> {
    const index = this._items.findIndex((i) => i.id === itemId && i.employeeId === employeeId);
    if (index === -1) {
      return Promise.reject(new Error(`Item ${itemId} not found for employee ${employeeId}.`));
    }
    this._items[index] = {
      ...this._items[index],
      status: 'Pending',
      returnCondition: undefined,
      note: '',
    };
    return Promise.resolve(this._itemsForEmployee(employeeId));
  }

  completeOffboarding(employeeId: string): Promise<string> {
    const items = this._itemsForEmployee(employeeId);
    if (!canComplete(items)) {
      return Promise.reject(
        new Error(
          `completeOffboarding: items for ${employeeId} cannot be completed — ` +
            `one or more items are still Pending, or an Issue item is missing a note.`,
        ),
      );
    }
    const completedAt = new Date().toISOString();
    const empIndex = this._employees.findIndex((e) => e.id === employeeId);
    if (empIndex !== -1) {
      this._employees[empIndex] = {
        ...this._employees[empIndex],
        offboardingStatus: 'Completed',
        completedAt,
      };
    }
    return Promise.resolve(completedAt);
  }

  private _itemsForEmployee(employeeId: string): AssignedItem[] {
    return this._items.filter((i) => i.employeeId === employeeId).map((i) => ({ ...i }));
  }
}

export const OFFBOARDING_REPO = new InjectionToken<IOffboardingRepository>('OFFBOARDING_REPO');
