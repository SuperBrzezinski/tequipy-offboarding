import { Route } from '@angular/router';
import {
  InMemoryOffboardingRepository,
  OFFBOARDING_REPO,
  OffboardingStore,
} from '@org/offboarding-feature/data-access';
import { OffboardingFeatureComponent } from './offboarding-feature.component';
import { EmployeeListPageComponent } from './components/employee-list/employee-list-page.component';
import { OffboardingSessionPageComponent } from './components/offboarding-session/offboarding-session-page.component';
import { canDeactivateSession } from './offboarding-session.guard';

export const OFFBOARDING_FEATURE_ROUTES: Route[] = [
  {
    path: '',
    component: OffboardingFeatureComponent,
    providers: [
      OffboardingStore,
      { provide: OFFBOARDING_REPO, useClass: InMemoryOffboardingRepository },
    ],
    children: [
      {
        path: '',
        component: EmployeeListPageComponent,
        title: 'Equipment Offboarding — Tequipy',
      },
      {
        path: 'offboarding/:employeeId',
        component: OffboardingSessionPageComponent,
        canDeactivate: [canDeactivateSession],
        title: 'Offboarding Session — Tequipy',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
