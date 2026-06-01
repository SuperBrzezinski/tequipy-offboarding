import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { OffboardingStore } from '@org/offboarding-feature/data-access';
import { canDeactivateSession } from './offboarding-session.guard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

function runGuard(): boolean | Promise<boolean> | ReturnType<typeof canDeactivateSession> {
  return TestBed.runInInjectionContext(() =>
    canDeactivateSession(null, null as never, null as never, null as never),
  );
}

describe('canDeactivateSession', () => {
  let store: OffboardingStore;
  let confirmationService: ConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OffboardingStore, ConfirmationService, { provide: Router, useValue: {} }],
    });
    store = TestBed.inject(OffboardingStore);
    confirmationService = TestBed.inject(ConfirmationService);
  });

  it('returns true immediately when store is not dirty', () => {
    // No open edits → navigation should proceed without any dialog.
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('emits true and calls cancelAnyEdit when admin confirms leaving', async () => {
    // Open an edit to make the store dirty.
    store.beginReturn('i-1');

    const cancelSpy = vi.spyOn(store, 'cancelAnyEdit');
    vi.spyOn(confirmationService, 'confirm').mockImplementation((opts) => {
      (opts.accept as () => void)();
      return undefined as unknown as ConfirmationService;
    });

    const result = await firstValueFrom(runGuard() as ReturnType<typeof import('rxjs').from>);

    expect(result).toBe(true);
    expect(cancelSpy).toHaveBeenCalledOnce();
  });

  it('emits false when admin chooses to stay', async () => {
    store.beginIssue('i-1');

    vi.spyOn(confirmationService, 'confirm').mockImplementation((opts) => {
      (opts.reject as () => void)?.();
      return undefined as unknown as ConfirmationService;
    });

    const result = await firstValueFrom(runGuard() as ReturnType<typeof import('rxjs').from>);

    expect(result).toBe(false);
  });

  it('shows the PrimeNG ConfirmDialog with correct labels when dirty', () => {
    store.beginReturn('i-1');

    const confirmSpy = vi.spyOn(confirmationService, 'confirm');

    // Observable is lazy — must subscribe to trigger the executor.
    (runGuard() as import('rxjs').Observable<boolean>).subscribe();

    expect(confirmSpy).toHaveBeenCalledOnce();
    const opts = confirmSpy.mock.calls[0][0];
    expect(opts.acceptLabel).toBe('Leave');
    expect(opts.rejectLabel).toBe('Stay');
  });
});
