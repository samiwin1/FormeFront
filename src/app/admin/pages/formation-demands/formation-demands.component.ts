import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorAdminService } from '../../services/mentor-admin.service';
import { FormationDemandAggregateDto, FormationDemandDto, RoleDemandCountDto } from '../../../features/mentor/models/mentor.models';

@Component({
  selector: 'app-formation-demands',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './formation-demands.component.html',
  styleUrl: './formation-demands.component.css',
})
export class FormationDemandsComponent implements OnInit {
  private readonly mentorAdmin = inject(MentorAdminService);

  demands: FormationDemandAggregateDto[] = [];
  byRole: RoleDemandCountDto[] = [];
  loading = false;
  error: string | null = null;

  // Expanded row state
  expandedRole: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.mentorAdmin.getFormationDemands().subscribe({
      next: data => {
        this.demands = data;
        this.loading = false;
      },
      error: err => {
        this.error = err.message ?? 'Failed to load formation demands';
        this.loading = false;
      },
    });
    this.mentorAdmin.getFormationDemandsByRole().subscribe({
      next: data => (this.byRole = data),
      error: () => {},
    });
  }

  toggleExpand(role: string): void {
    this.expandedRole = this.expandedRole === role ? null : role;
  }

  createFormationLink(role: string): string[] {
    return ['/admin/formations/create'];
  }

  topRoles(n = 5): RoleDemandCountDto[] {
    return this.byRole.slice(0, n);
  }

  maxCount(): number {
    return this.byRole.length > 0 ? this.byRole[0].count : 1;
  }

  barWidth(count: number): string {
    return `${Math.round((count / this.maxCount()) * 100)}%`;
  }

  fulfillDemand(demand: FormationDemandDto): void {
    if (demand.fulfilled) return;
    this.mentorAdmin.fulfillDemand(demand.id).subscribe({
      next: () => { demand.fulfilled = true; },
      error: (err) => { console.error('Fulfill failed', err); },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
  }
}
