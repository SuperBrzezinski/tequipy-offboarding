export type ReturnCondition = 'Good' | 'Damaged' | 'Missing accessories';

export type ItemStatus = 'Pending' | 'Returned' | 'Issue';

export type OffboardingStatus = 'In progress' | 'Completed';

export interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  offboardingDate: string;
  offboardingStatus: OffboardingStatus;
}

export interface AssignedItem {
  id: string;
  employeeId: string;
  name: string;
  type: string;
  serialNumber?: string;
  assignedCondition: ReturnCondition;
}

export interface ReturnItem {
  item: AssignedItem;
  status: ItemStatus;
  returnCondition?: ReturnCondition;
  note: string;
}

export interface EmployeeSession {
  employeeId: string;
  items: ReturnItem[];
  offboardingStatus: OffboardingStatus;
  completedAt: string | null;
  isDirty: boolean;
}
