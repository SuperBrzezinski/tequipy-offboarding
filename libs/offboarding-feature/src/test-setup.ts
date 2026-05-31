import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { afterEach } from 'vitest';

setupTestBed();

afterEach(() => {
  // Purge leaked Angular <style> tags injected by DomSharedStylesHost.
  // Without this they accumulate in the jsdom <head> and prevent GC,
  // causing monotonic heap growth across the test suite.
  document.querySelectorAll('style').forEach((s) => s.remove());

  // Force a major V8 GC cycle between tests so the Old Space stays shallow.
  // Requires --expose-gc in execArgv (set in vite.config.mts).
  if (typeof (globalThis as { gc?: () => void }).gc === 'function') {
    (globalThis as { gc: () => void }).gc();
  }
});
