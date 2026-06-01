import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AssignedItem, ReturnCondition } from '@org/offboarding-feature/domain';
import { EquipmentRowComponent } from '../equipment-row/equipment-row.component';

@Component({
  selector: 'tq-equipment-list',
  imports: [EquipmentRowComponent],
  templateUrl: './equipment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentListComponent {
  readonly items = input.required<AssignedItem[]>();
  readonly editingItem = input<{ itemId: string; mode: 'return' | 'issue' } | null>(null);
  readonly noteHints = input<Record<string, string>>({});
  readonly readOnly = input<boolean>(false);

  // mirrors EquipmentRowComponent outputs
  readonly beginReturn = output<string>();
  readonly confirmReturn = output<{ itemId: string; condition: ReturnCondition }>();
  readonly cancelReturn = output<string>();
  readonly undoReturn = output<string>();
  readonly beginIssue = output<string>();
  readonly confirmIssue = output<{ itemId: string; note: string }>();
  readonly cancelIssue = output<string>();
  readonly suggestNote = output<string>();

  protected isEditing(itemId: string): boolean {
    return this.editingItem()?.itemId === itemId;
  }

  protected getEditMode(itemId: string): 'return' | 'issue' | null {
    const editingState = this.editingItem();
    return editingState?.itemId === itemId ? editingState.mode : null;
  }
}
