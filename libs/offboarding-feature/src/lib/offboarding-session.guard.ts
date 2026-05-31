import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { OffboardingStore } from '@org/offboarding-feature/data-access';

export const canDeactivateSession: CanDeactivateFn<unknown> = () => {
  const store = inject(OffboardingStore);
  if (!store.isDirty()) return true;
  const leave = window.confirm('You have an unsaved edit. Leave and discard?');
  if (leave) store.cancelAnyEdit();
  return leave;
};
