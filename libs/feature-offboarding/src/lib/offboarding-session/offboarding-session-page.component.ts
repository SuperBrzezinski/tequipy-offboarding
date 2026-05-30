import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { OFFBOARDING_REPO } from '@org/data-access';
import { isConditionWorse, suggestNote as suggestNoteFn } from '@org/domain';
import type { ReturnCondition } from '@org/domain';
import { EquipmentListComponent } from '@org/ui';
import { OffboardingStore } from '../offboarding.store';

@Component({
  selector: 'lib-offboarding-session-page',
  imports: [EquipmentListComponent, ConfirmDialog],
  templateUrl: './offboarding-session-page.component.html',
  styleUrl: './offboarding-session-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class OffboardingSessionPageComponent {
  readonly employeeId = input.required<string>();

  private readonly repo = inject(OFFBOARDING_REPO);
  private readonly router = inject(Router);
  protected readonly store = inject(OffboardingStore);
  private readonly confirmationService = inject(ConfirmationService);

  // Resource loads raw employee + item data (handles loading/error UI).
  protected readonly sessionResource = resource({
    params: () => ({ id: this.employeeId() }),
    loader: async ({ params }) => {
      const [employee, items] = await Promise.all([
        this.repo.getEmployee(params.id),
        this.repo.getAssignedItems(params.id),
      ]);
      return { employee, items };
    },
  });

  // Derive session from store (null until loadSession is called).
  // getSessionReactive accepts the signal directly — one stable computed,
  // no new allocation each time employeeId changes.
  protected readonly session = this.store.getSessionReactive(this.employeeId);

  // Note hints for the suggest-note feature: keyed by itemId.
  protected readonly noteHints = signal<Record<string, string>>({});

  constructor() {
    // When resource loads, seed the store. loadSession is idempotent —
    // navigating back is a no-op that preserves in-progress work.
    // Guard: skip when loading or in error state — Angular 21 resource.value()
    // throws when the resource has an error, so check status first.
    effect(() => {
      if (this.sessionResource.isLoading() || this.sessionResource.error()) return;
      const data = this.sessionResource.value();
      if (data?.employee) {
        this.store.loadSession(data.employee, data.items);
      }
    });
  }

  // --- Navigation -----------------------------------------------------------

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // --- Event handlers -------------------------------------------------------

  protected onBeginReturn(itemId: string): void {
    this.store.beginReturn(this.employeeId(), itemId);
  }

  protected onConfirmReturn(event: { itemId: string; condition: ReturnCondition }): void {
    const session = this.session();
    if (!session) return;
    const ri = session.items.find((i) => i.item.id === event.itemId);
    if (!ri) return;

    if (isConditionWorse(ri.item.assignedCondition, event.condition)) {
      // Show a soft-confirm dialog: the admin recorded a worse condition than
      // what was assigned. They must explicitly acknowledge before we commit.
      this.confirmationService.confirm({
        message: `"${ri.item.name}" was assigned as "${ri.item.assignedCondition}". You are recording it as "${event.condition}". Continue?`,
        header: 'Condition downgrade',
        acceptLabel: 'Continue',
        rejectLabel: 'Go back',
        accept: () => this.store.confirmReturn(this.employeeId(), event.itemId, event.condition),
        // reject: intentional no-op — item stays in editing mode so the admin
        // can pick a different condition without losing their form state.
      });
    } else {
      this.store.confirmReturn(this.employeeId(), event.itemId, event.condition);
    }
  }

  protected onCancelReturn(itemId: string): void {
    this.store.cancelReturn(this.employeeId(), itemId);
  }

  protected onUndoReturn(itemId: string): void {
    this.store.undoReturn(this.employeeId(), itemId);
  }

  protected onBeginIssue(itemId: string): void {
    this.store.beginIssue(this.employeeId(), itemId);
  }

  protected onConfirmIssue(event: { itemId: string; note: string }): void {
    this.store.confirmIssue(this.employeeId(), event.itemId, event.note);
  }

  protected onCancelIssue(itemId: string): void {
    this.store.cancelIssue(this.employeeId(), itemId);
  }

  protected onSuggestNote(itemId: string): void {
    const session = this.session();
    if (!session) return;
    const ri = session.items.find((i) => i.item.id === itemId);
    if (!ri) return;
    // suggestNoteFn is a pure domain function — no Angular dependency, fully
    // testable in isolation. The result is stored in local signal state so it
    // flows down to the correct EquipmentRowComponent via noteHints input.
    const suggestion = suggestNoteFn(ri.item.type, ri.item.assignedCondition);
    this.noteHints.update((h) => ({ ...h, [itemId]: suggestion }));
  }
}
