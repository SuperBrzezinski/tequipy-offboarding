import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ItemStatus } from '@org/domain';
import { TagModule } from 'primeng/tag';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

const SEVERITY_MAP: Record<ItemStatus, TagSeverity> = {
  Pending: 'warn',
  Returned: 'success',
  Issue: 'danger',
};

@Component({
  selector: 'lib-status-badge',
  imports: [TagModule],
  template: `<p-tag [severity]="severity()" [value]="status()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<ItemStatus>();

  protected readonly severity = computed<TagSeverity>(() => SEVERITY_MAP[this.status()]);
}
