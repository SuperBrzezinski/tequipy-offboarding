import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { isConditionWorse } from '@org/domain';
import type { ReturnCondition } from '@org/domain';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'lib-condition-diff-badge',
  imports: [TagModule],
  template: `
    @if (hasDiff()) {
      <p-tag
        [value]="label()"
        [severity]="severity()"
        [attr.data-severity]="severity() ?? 'default'"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionDiffBadgeComponent {
  readonly assignedCondition = input.required<ReturnCondition>();
  readonly returnCondition = input.required<ReturnCondition>();

  /** True only when the two conditions are different — drives the @if guard. */
  protected readonly hasDiff = computed(() => this.returnCondition() !== this.assignedCondition());

  protected readonly label = computed(
    () => `Was: ${this.assignedCondition()} → Now: ${this.returnCondition()}`,
  );

  protected readonly severity = computed<'warn' | undefined>(() =>
    isConditionWorse(this.assignedCondition(), this.returnCondition()) ? 'warn' : undefined,
  );
}
