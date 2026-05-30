import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('@org/feature-offboarding').then((m) => m.EmployeeListPageComponent),
    title: 'Equipment Offboarding — Tequipy',
  },
  {
    path: 'offboarding/:employeeId',
    loadComponent: () =>
      import('@org/feature-offboarding').then((m) => m.OffboardingSessionPageComponent),
    title: 'Offboarding Session — Tequipy',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
