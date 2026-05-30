export { EmployeeListPageComponent } from './lib/employee-list/employee-list-page.component';
export { OffboardingSessionPageComponent } from './lib/offboarding-session/offboarding-session-page.component';
// OffboardingStore moved to @org/data-access so the app shell can import it without
// a static dependency on this lazy-loaded lib (needed for the canDeactivate guard).
export { OffboardingStore } from '@org/data-access';
export type { StoredSession } from '@org/data-access';
