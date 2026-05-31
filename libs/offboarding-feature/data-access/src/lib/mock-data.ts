import type { AssignedItem, Employee } from '@org/offboarding-feature/domain';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: 'Maria Kowalski',
    department: 'Engineering',
    email: 'maria.kowalski@tequipy.com',
    offboardingDate: '2024-06-30',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-002',
    name: 'Tomasz Wierzbicki',
    department: 'Sales',
    email: 'tomasz.wierzbicki@tequipy.com',
    offboardingDate: '2024-07-15',
    offboardingStatus: 'In progress',
  },
];

export const MOCK_ASSIGNED_ITEMS: AssignedItem[] = [
  // Maria Kowalski — 3 items
  {
    id: 'eq-101',
    employeeId: 'emp-001',
    name: 'MacBook Pro 14"',
    type: 'Laptop',
    serialNumber: 'C02XG2JHQ6DN',
    assignedCondition: 'Good',
  },
  {
    id: 'eq-102',
    employeeId: 'emp-001',
    name: 'Dell 27" Monitor',
    type: 'Monitor',
    serialNumber: 'CN-0T7VWR-48621',
    assignedCondition: 'Good',
  },
  {
    id: 'eq-103',
    employeeId: 'emp-001',
    name: 'Logitech MX Keys',
    type: 'Keyboard',
    serialNumber: '2246OD118965',
    assignedCondition: 'Good',
  },

  // Tomasz Wierzbicki — 2 items
  {
    id: 'eq-201',
    employeeId: 'emp-002',
    name: 'Lenovo ThinkPad X1',
    type: 'Laptop',
    serialNumber: 'PF2YNAB2',
    assignedCondition: 'Good',
  },
  {
    id: 'eq-202',
    employeeId: 'emp-002',
    name: 'iPhone 14 Pro',
    type: 'Phone',
    serialNumber: 'DNPXC3J3Q1GC',
    assignedCondition: 'Good',
  },
];
