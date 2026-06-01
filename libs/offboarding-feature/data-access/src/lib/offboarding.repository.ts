import { Injectable, InjectionToken } from '@angular/core';
import type {
  AssignedItem,
  Employee,
  IOffboardingRepository,
  ReturnCondition,
  ReturnItem,
} from '@org/offboarding-feature/domain';
import { canComplete } from '@org/offboarding-feature/domain';
import { MOCK_ASSIGNED_ITEMS, MOCK_EMPLOYEES } from './mock-data';

@Injectable()
export class InMemoryOffboardingRepository implements IOffboardingRepository {
  private readonly _employees: Employee[] = MOCK_EMPLOYEES.map((e) => ({ ...e }));
  private readonly _sessionItems = new Map<string, ReturnItem[]>();

  getEmployees(): Promise<Employee[]> {
    return Promise.resolve(this._employees.map((e) => ({ ...e })));
  }

  getEmployee(id: string): Promise<Employee | undefined> {
    const employee = this._employees.find((e) => e.id === id);
    return Promise.resolve(employee ? { ...employee } : undefined);
  }

  getAssignedItems(employeeId: string): Promise<AssignedItem[]> {
    return Promise.resolve(
      MOCK_ASSIGNED_ITEMS.filter((item) => item.employeeId === employeeId).map((item) => ({
        ...item,
      })),
    );
  }

  getSessionItems(employeeId: string): Promise<ReturnItem[] | null> {
    const items = this._sessionItems.get(employeeId);
    return Promise.resolve(items ? this._copyItems(items) : null);
  }

  initSession(employeeId: string, items: AssignedItem[]): Promise<void> {
    if (this._sessionItems.has(employeeId)) return Promise.resolve();

    const employee = this._employees.find((e) => e.id === employeeId);
    const isCompleted = employee?.offboardingStatus === 'Completed';
    const returnItems: ReturnItem[] = items.map((ai) =>
      isCompleted
        ? { item: ai, status: 'Returned' as const, returnCondition: ai.assignedCondition, note: '' }
        : { item: ai, status: 'Pending' as const, note: '' },
    );

    this._sessionItems.set(employeeId, returnItems);
    return Promise.resolve();
  }

  markItemReturned(
    employeeId: string,
    itemId: string,
    condition: ReturnCondition,
  ): Promise<ReturnItem[]> {
    const items = this._sessionItems.get(employeeId);
    if (!items) return Promise.reject(new Error(`No session loaded for employee ${employeeId}.`));
    const updated = items.map((ri) =>
      ri.item.id === itemId
        ? { item: ri.item, status: 'Returned' as const, returnCondition: condition, note: ri.note }
        : ri,
    );
    this._sessionItems.set(employeeId, updated);
    return Promise.resolve(this._copyItems(updated));
  }

  markItemIssue(employeeId: string, itemId: string, note: string): Promise<ReturnItem[]> {
    if (!note.trim()) {
      return Promise.reject(new Error(`markItemIssue: note must not be empty for item ${itemId}.`));
    }
    const items = this._sessionItems.get(employeeId);
    if (!items) return Promise.reject(new Error(`No session loaded for employee ${employeeId}.`));
    const updated = items.map((ri) =>
      ri.item.id === itemId ? { item: ri.item, status: 'Issue' as const, note } : ri,
    );
    this._sessionItems.set(employeeId, updated);
    return Promise.resolve(this._copyItems(updated));
  }

  revertItem(employeeId: string, itemId: string): Promise<ReturnItem[]> {
    const items = this._sessionItems.get(employeeId);
    if (!items) return Promise.reject(new Error(`No session loaded for employee ${employeeId}.`));
    const updated = items.map((ri) =>
      ri.item.id === itemId ? { item: ri.item, status: 'Pending' as const, note: '' } : ri,
    );
    this._sessionItems.set(employeeId, updated);
    return Promise.resolve(this._copyItems(updated));
  }

  completeOffboarding(employeeId: string): Promise<string> {
    const items = this._sessionItems.get(employeeId);
    if (!items) return Promise.reject(new Error(`No session loaded for employee ${employeeId}.`));
    if (!canComplete(items)) {
      return Promise.reject(
        new Error(
          `completeOffboarding: session for ${employeeId} cannot be completed — ` +
            `one or more items are still Pending, or an Issue item is missing a note.`,
        ),
      );
    }
    const completedAt = new Date().toISOString();
    const index = this._employees.findIndex((e) => e.id === employeeId);
    if (index !== -1) {
      this._employees[index] = {
        ...this._employees[index],
        offboardingStatus: 'Completed',
        completedAt,
      };
    }
    return Promise.resolve(completedAt);
  }

  private _copyItems(items: ReturnItem[]): ReturnItem[] {
    return items.map((ri) => ({ ...ri, item: { ...ri.item } }));
  }
}

export const OFFBOARDING_REPO = new InjectionToken<IOffboardingRepository>('OFFBOARDING_REPO');
