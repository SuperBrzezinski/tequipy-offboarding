import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ItemStatus } from '@org/offboarding-feature/domain';
import { TagModule } from 'primeng/tag';

const SEVERITY_MAP: Record<ItemStatus, 'warn' | 'success' | 'danger'> = {
  Pending: 'warn',
  Returned: 'success',
  Issue: 'danger',
};

@Component({
  selector: 'tq-status-badge',
  imports: [TagModule],
  template: `<p-tag [severity]="severity()" [value]="status()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<ItemStatus>();

  protected readonly severity = computed(() => SEVERITY_MAP[this.status()]);
}
