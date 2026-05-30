import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { OffboardingStore } from '@org/data-access';

/**
 * Prevents the router from leaving the session route when the admin has an
 * uncommitted form edit open (isDirty). The confirm dialog is a native
 * window.confirm — PrimeNG's ConfirmDialog cannot be used here because the
 * guard runs outside any component's injection context.
 */
export const canDeactivateSession: CanDeactivateFn<unknown> = () => {
  const store = inject(OffboardingStore);
  if (!store.isDirty()) return true;
  const leave = window.confirm('You have an unsaved edit. Leave and discard?');
  if (leave) store.cancelAnyEdit();
  return leave;
};
