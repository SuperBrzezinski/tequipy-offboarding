import { Route } from '@angular/router';
import { canDeactivateSession } from './offboarding-session.guard';

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
    canDeactivate: [canDeactivateSession],
    title: 'Offboarding Session — Tequipy',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
