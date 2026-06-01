import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { OffboardingStatus } from '@org/offboarding-feature/domain';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { formatDate } from '../utils/format-date';

@Component({
  selector: 'tq-summary-panel',
  imports: [ButtonModule, TagModule],
  templateUrl: './summary-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPanelComponent {
  readonly pendingCount = input.required<number>();
  readonly returnedCount = input.required<number>();
  readonly issueCount = input.required<number>();
  readonly canComplete = input.required<boolean>();
  /** Shown below the complete button when canComplete() is false. */
  readonly pendingReason = input<string | null>(null);
  readonly offboardingStatus = input.required<OffboardingStatus>();
  readonly completedAt = input<string | null>(null);

  readonly complete = output<void>();

  // Exposed as an arrow so Angular templates can call it as a class member.
  // showTime=true: summary panel shows the full timestamp including hh:mm.
  protected readonly formatTimestamp = (iso: string) => formatDate(iso, true);
}
