import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { Router } from '@angular/router';
import { OFFBOARDING_REPO } from '@org/data-access';

@Component({
  selector: 'lib-offboarding-session-page',
  imports: [],
  templateUrl: './offboarding-session-page.component.html',
  styleUrl: './offboarding-session-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffboardingSessionPageComponent {
  readonly employeeId = input.required<string>();

  private readonly repo = inject(OFFBOARDING_REPO);
  private readonly router = inject(Router);

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

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }
}
