import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { OFFBOARDING_REPO, OffboardingStore } from '@org/offboarding-feature/data-access';
import {
  canComplete,
  hasOpenIssues,
  isConditionWorse,
  suggestNote as suggestNoteFn,
} from '@org/offboarding-feature/domain';
import type {
  OffboardingStatus,
  ReturnCondition,
  ReturnItem,
} from '@org/offboarding-feature/domain';
import { EquipmentListComponent } from '../equipment-list/equipment-list.component';
import { SummaryPanelComponent } from '../summary-panel/summary-panel.component';
import { formatDate } from '../utils/format-date';

@Component({
  selector: 'tq-offboarding-session-page',
  imports: [EquipmentListComponent, SummaryPanelComponent, SkeletonModule, ButtonModule],
  templateUrl: './offboarding-session-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffboardingSessionPageComponent {
  readonly employeeId = input.required<string>();

  private readonly repo = inject(OFFBOARDING_REPO);
  private readonly router = inject(Router);
  protected readonly store = inject(OffboardingStore);
  private readonly confirmationService = inject(ConfirmationService);

  // Session state — owned by the repo, mirrored locally for reactive rendering.
  // Mutations call the repo and update these signals from the returned payload.
  private readonly _items = signal<ReturnItem[]>([]);
  private readonly _offboardingStatus = signal<OffboardingStatus>('In progress');
  private readonly _completedAt = signal<string | null>(null);
  private readonly _isSessionLoaded = signal<boolean>(false);

  protected readonly items = this._items.asReadonly();
  protected readonly offboardingStatus = this._offboardingStatus.asReadonly();
  protected readonly completedAt = this._completedAt.asReadonly();
  protected readonly isSessionLoaded = this._isSessionLoaded.asReadonly();

  protected readonly sessionResource = resource({
    params: () => ({ id: this.employeeId() }),
    loader: async ({ params }) => {
      const [employee, assignedItems] = await Promise.all([
        this.repo.getEmployee(params.id),
        this.repo.getAssignedItems(params.id),
      ]);
      if (employee) {
        await this.repo.initSession(params.id, assignedItems);
      }
      const sessionItems = employee ? await this.repo.getSessionItems(params.id) : null;
      return { employee, sessionItems: sessionItems ?? [] };
    },
  });

  protected readonly noteHints = signal<Record<string, string>>({});

  protected readonly pendingCount = computed(
    () => this._items().filter((item) => item.status === 'Pending').length,
  );
  protected readonly returnedCount = computed(
    () => this._items().filter((item) => item.status === 'Returned').length,
  );
  protected readonly issueCount = computed(
    () => this._items().filter((item) => item.status === 'Issue').length,
  );

  protected readonly sessionCanComplete = computed(() => canComplete(this._items()));

  protected readonly sessionHasOpenIssues = computed(() => hasOpenIssues(this._items()));

  protected readonly pendingReason = computed<string | null>(() => {
    if (this.sessionCanComplete()) return null;
    const pending = this.pendingCount();
    if (pending > 0) return `${pending} item${pending === 1 ? '' : 's'} still pending`;
    if (this._items().length === 0) return 'No equipment assigned';
    const issueWithoutNote = this._items().filter(
      (item) => item.status === 'Issue' && !item.note.trim(),
    ).length;
    if (issueWithoutNote > 0)
      return `${issueWithoutNote} issue item${issueWithoutNote === 1 ? '' : 's'} need${issueWithoutNote === 1 ? 's' : ''} a note`;
    return null;
  });

  protected readonly isCompleted = computed(() => this._offboardingStatus() === 'Completed');

  constructor() {
    effect(() => {
      if (this.sessionResource.isLoading() || this.sessionResource.error()) return;
      const data = this.sessionResource.value();
      if (!data?.employee) return;

      this._items.set(data.sessionItems);
      this._offboardingStatus.set(data.employee.offboardingStatus);
      this._completedAt.set(
        data.employee.offboardingStatus === 'Completed'
          ? (data.employee.completedAt ?? data.employee.offboardingDate)
          : null,
      );
      this._isSessionLoaded.set(true);
    });
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  protected readonly formatDate = formatDate;

  protected onComplete(): void {
    const items = this._items();
    if (!canComplete(items)) return;

    if (hasOpenIssues(items)) {
      const issueReturnItems = items.filter((item) => item.status === 'Issue');
      const issueCount = issueReturnItems.length;
      const issueLines = issueReturnItems
        .map(
          (item) =>
            `• ${this.escapeHtml(item.item.name)}${item.note ? ` — ${this.escapeHtml(item.note)}` : ''}`,
        )
        .join('<br>');

      this.confirmationService.confirm({
        message: `Complete offboarding with ${issueCount} unresolved issue${issueCount === 1 ? '' : 's'}?<br>${issueLines}<br><br>This action cannot be undone.`,
        header: 'Unresolved issues',
        acceptLabel: 'Complete anyway',
        rejectLabel: 'Go back',
        accept: () => this._doComplete(),
      });
    } else {
      this._doComplete();
    }
  }

  protected onBeginReturn(itemId: string): void {
    this.store.beginReturn(itemId);
  }

  protected onConfirmReturn(event: { itemId: string; condition: ReturnCondition }): void {
    const returnItem = this._items().find((item) => item.item.id === event.itemId);
    if (!returnItem) return;

    if (isConditionWorse(returnItem.item.assignedCondition, event.condition)) {
      this.confirmationService.confirm({
        message: `"${returnItem.item.name}" was assigned as "${returnItem.item.assignedCondition}". You are recording it as "${event.condition}". Continue?`,
        header: 'Condition downgrade',
        acceptLabel: 'Continue',
        rejectLabel: 'Go back',
        accept: () => this._doMarkReturned(event.itemId, event.condition),
      });
    } else {
      this._doMarkReturned(event.itemId, event.condition);
    }
  }

  protected onCancelReturn(): void {
    this.store.cancelReturn();
  }

  protected onUndoReturn(itemId: string): void {
    this.repo.revertItem(this.employeeId(), itemId).then((items) => this._items.set(items));
  }

  protected onBeginIssue(itemId: string): void {
    this.store.beginIssue(itemId);
  }

  protected onConfirmIssue(event: { itemId: string; note: string }): void {
    this.repo.markItemIssue(this.employeeId(), event.itemId, event.note).then((items) => {
      this._items.set(items);
      this.store.confirmIssue();
    });
  }

  protected onCancelIssue(): void {
    const editingItemId = this.store.editingItem()?.itemId;
    if (editingItemId) {
      this.noteHints.update((h) => {
        const next = { ...h };
        delete next[editingItemId];
        return next;
      });
    }
    this.store.cancelIssue();
  }

  protected onSuggestNote(itemId: string): void {
    const returnItem = this._items().find((item) => item.item.id === itemId);
    if (!returnItem) return;
    const editMode = this.store.editingItem()?.mode;
    const condition: ReturnCondition =
      editMode === 'issue' && returnItem.item.assignedCondition === 'Good'
        ? 'Damaged'
        : returnItem.item.assignedCondition;
    const suggestion = suggestNoteFn(returnItem.item.type, condition);
    this.noteHints.update((h) => ({ ...h, [itemId]: suggestion }));
  }

  private _doMarkReturned(itemId: string, condition: ReturnCondition): void {
    this.repo.markItemReturned(this.employeeId(), itemId, condition).then((items) => {
      this._items.set(items);
      this.store.confirmReturn();
    });
  }

  private _doComplete(): void {
    this.repo.completeOffboarding(this.employeeId()).then((completedAt) => {
      this._offboardingStatus.set('Completed');
      this._completedAt.set(completedAt);
    });
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
