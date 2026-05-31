import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { Router } from '@angular/router';
import { OFFBOARDING_REPO } from '@org/offboarding-feature/data-access';
import type { Employee } from '@org/offboarding-feature/domain';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'lib-employee-list-page',
  imports: [TableModule, TagModule, SkeletonModule, MessageModule, ButtonModule],
  templateUrl: './employee-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListPageComponent {
  private readonly repo = inject(OFFBOARDING_REPO);
  private readonly router = inject(Router);

  protected readonly employeesResource = resource({
    loader: () => this.repo.getEmployees(),
  });

  protected navigateToSession(employee: Employee): void {
    this.router.navigate(['/offboarding', employee.id]);
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
