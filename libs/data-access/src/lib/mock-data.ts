import type { AssignedItem, Employee } from '@org/domain';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: 'Sarah Chen',
    department: 'Engineering',
    email: 'sarah.chen@tequipy.com',
    offboardingDate: '2026-06-15',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-002',
    name: 'Marcus Webb',
    department: 'Design',
    email: 'marcus.webb@tequipy.com',
    offboardingDate: '2026-06-10',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-003',
    name: 'Priya Nair',
    department: 'Sales',
    email: 'priya.nair@tequipy.com',
    offboardingDate: '2026-06-20',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-004',
    name: 'Tom Keller',
    department: 'Finance',
    email: 'tom.keller@tequipy.com',
    offboardingDate: '2026-06-05',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-005',
    name: 'Amara Osei',
    department: 'Operations',
    email: 'amara.osei@tequipy.com',
    offboardingDate: '2026-06-08',
    offboardingStatus: 'In progress',
  },
  {
    id: 'emp-006',
    name: 'Jordan Blake',
    department: 'Marketing',
    email: 'jordan.blake@tequipy.com',
    offboardingDate: '2026-05-20',
    offboardingStatus: 'Completed',
  },
];

export const MOCK_ASSIGNED_ITEMS: AssignedItem[] = [
  // Sarah Chen — 3 items (Laptop, Monitor, Headset)
  {
    id: 'item-001',
    employeeId: 'emp-001',
    name: 'MacBook Pro 14"',
    type: 'Laptop',
    serialNumber: 'C02XK0JHJG5L',
    assignedCondition: 'Good',
  },
  {
    id: 'item-002',
    employeeId: 'emp-001',
    name: 'LG UltraFine 27"',
    type: 'Monitor',
    serialNumber: 'LG2023-00441',
    assignedCondition: 'Good',
  },
  {
    id: 'item-003',
    employeeId: 'emp-001',
    name: 'Sony WH-1000XM5',
    type: 'Headset',
    assignedCondition: 'Good',
  },

  // Marcus Webb — 2 items (Laptop, Keyboard)
  {
    id: 'item-004',
    employeeId: 'emp-002',
    name: 'MacBook Air 15"',
    type: 'Laptop',
    serialNumber: 'C02YN1KJHV29',
    assignedCondition: 'Good',
  },
  {
    id: 'item-005',
    employeeId: 'emp-002',
    name: 'Logitech MX Keys',
    type: 'Keyboard',
    assignedCondition: 'Missing accessories',
  },

  // Priya Nair — 3 items (Laptop, Monitor, Docking Station)
  {
    id: 'item-006',
    employeeId: 'emp-003',
    name: 'Dell XPS 15',
    type: 'Laptop',
    serialNumber: 'DL-XPS-88821',
    assignedCondition: 'Good',
  },
  {
    id: 'item-007',
    employeeId: 'emp-003',
    name: 'Dell 27" 4K Monitor',
    type: 'Monitor',
    serialNumber: 'DELL-P2723QE-0012',
    assignedCondition: 'Good',
  },
  {
    id: 'item-008',
    employeeId: 'emp-003',
    name: 'CalDigit TS4 Dock',
    type: 'Docking Station',
    serialNumber: 'CDG-TS4-7741',
    assignedCondition: 'Good',
  },

  // Tom Keller — 2 items (Laptop, Mouse)
  {
    id: 'item-009',
    employeeId: 'emp-004',
    name: 'ThinkPad X1 Carbon',
    type: 'Laptop',
    serialNumber: 'TP-X1-339210',
    assignedCondition: 'Damaged',
  },
  {
    id: 'item-010',
    employeeId: 'emp-004',
    name: 'Logitech MX Master 3',
    type: 'Mouse',
    assignedCondition: 'Good',
  },

  // emp-005 (Amara Osei) — intentionally NO items (empty state exercise)

  // Jordan Blake (emp-006, Completed) — 2 items; pre-completed state
  {
    id: 'item-011',
    employeeId: 'emp-006',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    serialNumber: 'C02ZK9XKHV29',
    assignedCondition: 'Good',
  },
  {
    id: 'item-012',
    employeeId: 'emp-006',
    name: 'Apple Magic Mouse',
    type: 'Mouse',
    assignedCondition: 'Good',
  },
];
