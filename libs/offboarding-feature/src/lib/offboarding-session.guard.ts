import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { OffboardingStore } from '@org/offboarding-feature/data-access';

export const canDeactivateSession: CanDeactivateFn<unknown> = () => {
  const store = inject(OffboardingStore);
  if (!store.isDirty()) return true;

  const confirmationService = inject(ConfirmationService);
  return new Observable<boolean>((observer) => {
    confirmationService.confirm({
      message: 'You have an unsaved edit. Leaving will discard it.',
      header: 'Unsaved changes',
      acceptLabel: 'Leave',
      rejectLabel: 'Stay',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'primary' },
      accept: () => {
        store.cancelAnyEdit();
        observer.next(true);
        observer.complete();
      },
      reject: () => {
        observer.next(false);
        observer.complete();
      },
    });
  });
};
