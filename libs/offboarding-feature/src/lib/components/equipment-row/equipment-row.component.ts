import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CONDITION_SEVERITY } from '@org/offboarding-feature/domain';
import type { AssignedItem, ReturnCondition } from '@org/offboarding-feature/domain';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ConditionDiffBadgeComponent } from '../condition-diff-badge/condition-diff-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'tq-equipment-row',
  imports: [
    ButtonModule,
    ConditionDiffBadgeComponent,
    FormsModule,
    SelectModule,
    TagModule,
    TextareaModule,
    StatusBadgeComponent,
  ],
  templateUrl: './equipment-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentRowComponent {
  readonly item = input.required<AssignedItem>();
  readonly isEditing = input<boolean>(false);
  readonly editMode = input<'return' | 'issue' | null>(null);
  readonly suggestedNote = input<string | null>(null);
  readonly readOnly = input<boolean>(false);

  readonly beginReturn = output<string>();
  readonly confirmReturn = output<{ itemId: string; condition: ReturnCondition }>();
  readonly cancelReturn = output<string>();
  readonly undoReturn = output<string>();
  readonly beginIssue = output<string>();
  readonly confirmIssue = output<{ itemId: string; note: string }>();
  readonly cancelIssue = output<string>();
  readonly suggestNote = output<string>();

  readonly selectedCondition = signal<ReturnCondition | null>(null);
  readonly noteValue = signal('');

  // Derived from the domain constant so the template list stays in sync with the type union.
  protected readonly conditionOptions = Object.keys(CONDITION_SEVERITY) as ReturnCondition[];

  constructor() {
    effect(() => {
      // Reset fires only on false → preserves in-progress state when parent opens the edit.
      if (!this.isEditing()) {
        this.selectedCondition.set(null);
        this.noteValue.set('');
      }
    });

    effect(() => {
      // Populates the note textarea when the parent provides a suggested note.
      // Only writes when a non-null hint arrives so clearing the store signal
      // (null) does not wipe a note the admin has already started typing.
      const hint = this.suggestedNote();
      if (hint) {
        this.noteValue.set(hint);
      }
    });
  }

  protected onNoteInput(event: Event): void {
    this.noteValue.set((event.target as HTMLTextAreaElement).value);
  }

  protected onConfirmReturn(): void {
    const condition = this.selectedCondition();
    if (!condition) return;
    this.confirmReturn.emit({ itemId: this.item().id, condition });
    this.selectedCondition.set(null);
  }

  protected onConfirmIssue(): void {
    const note = this.noteValue().trim();
    if (!note) return;
    this.confirmIssue.emit({ itemId: this.item().id, note });
    this.noteValue.set('');
  }
}
