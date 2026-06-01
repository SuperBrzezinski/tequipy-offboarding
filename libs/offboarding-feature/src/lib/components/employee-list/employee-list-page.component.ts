import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OFFBOARDING_REPO } from '@org/offboarding-feature/data-access';
import type { Employee, OffboardingStatus } from '@org/offboarding-feature/domain';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { formatDate } from '../utils/format-date';

@Component({
  selector: 'tq-employee-list-page',
  imports: [
    FormsModule,
    TableModule,
    TagModule,
    SkeletonModule,
    MessageModule,
    ButtonModule,
    SelectModule,
  ],
  templateUrl: './employee-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListPageComponent {
  private readonly repo = inject(OFFBOARDING_REPO);
  private readonly router = inject(Router);

  protected readonly statusOptions: OffboardingStatus[] = ['In progress', 'Completed'];

  protected readonly employeesResource = resource({
    loader: () => this.repo.getEmployees(),
  });

  protected readonly employees = computed<Employee[]>(() => this.employeesResource.value() ?? []);

  protected readonly formatDate = formatDate;

  protected navigateToSession(employee: Employee): void {
    this.router.navigate(['/offboarding', employee.id]);
  }
}
