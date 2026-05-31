import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('@org/offboarding-feature').then((m) => m.OFFBOARDING_FEATURE_ROUTES),
  },
];
