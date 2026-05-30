import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CONDITION_SEVERITY } from '@org/domain';
import type { ReturnCondition, ReturnItem } from '@org/domain';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ConditionDiffBadgeComponent } from '../condition-diff-badge/condition-diff-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'lib-equipment-row',
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
  styleUrl: './equipment-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentRowComponent {
  // --- Inputs ---
  readonly item = input.required<ReturnItem>();
  readonly isEditing = input<boolean>(false);
  readonly editMode = input<'return' | 'issue' | null>(null);
  readonly suggestedNote = input<string | null>(null);
  readonly readOnly = input<boolean>(false);

  // --- Outputs ---
  readonly beginReturn = output<string>();
  readonly confirmReturn = output<{ itemId: string; condition: ReturnCondition }>();
  readonly cancelReturn = output<string>();
  readonly undoReturn = output<string>();
  readonly beginIssue = output<string>();
  readonly confirmIssue = output<{ itemId: string; note: string }>();
  readonly cancelIssue = output<string>();
  readonly suggestNote = output<string>();

  // --- Local UI state ---
  protected readonly selectedCondition = signal<ReturnCondition | null>(null);
  protected readonly noteValue = signal('');

  // Derived from the domain constant so the template list stays in sync with the type union.
  protected readonly conditionOptions = Object.keys(CONDITION_SEVERITY) as ReturnCondition[];

  constructor() {
    effect(() => {
      // Runs whenever isEditing changes. Reset only fires on false → clears
      // any in-progress selection or note text when the parent closes the edit.
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
    this.confirmReturn.emit({ itemId: this.item().item.id, condition });
    this.selectedCondition.set(null);
  }

  protected onConfirmIssue(): void {
    const note = this.noteValue().trim();
    if (!note) return;
    this.confirmIssue.emit({ itemId: this.item().item.id, note });
    this.noteValue.set('');
  }
}
