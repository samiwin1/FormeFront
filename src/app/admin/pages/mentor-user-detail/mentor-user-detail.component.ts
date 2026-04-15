import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MentorAdminService, UserSummary } from '../../services/mentor-admin.service';

@Component({
  selector: 'app-mentor-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './mentor-user-detail.component.html',
  styleUrls: ['./mentor-user-detail.component.css']
})
export class MentorUserDetailComponent implements OnInit {
  private readonly mentorAdminService = inject(MentorAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  userId!: number;
  userSummary: UserSummary | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.userId = +this.route.snapshot.params['userId'];
    this.loadUserSummary();
  }

  loadUserSummary() {
    this.loading = true;
    this.error = null;
    this.mentorAdminService.getUserSummary(this.userId).subscribe({
      next: (summary) => {
        this.userSummary = summary;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/mentor-users']);
  }

  getChannelEntries() {
    return Object.entries(this.userSummary?.sessions.byChannel || {});
  }

  getChannelKeys() {
    return Object.keys(this.userSummary?.sessions.byChannel || {});
  }

  getChannelValue(channel: string): number {
    return this.userSummary?.sessions.byChannel[channel] || 0;
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  getExperienceBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      'BEGINNER': 'bg-success',
      'INTERMEDIATE': 'bg-warning',
      'ADVANCED': 'bg-danger',
      'EXPERT': 'bg-dark'
    };
    return classes[level] || 'bg-secondary';
  }

  getSkillBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      'BEGINNER': 'bg-light text-dark',
      'INTERMEDIATE': 'bg-info',
      'ADVANCED': 'bg-primary',
      'EXPERT': 'bg-dark'
    };
    return classes[level] || 'bg-secondary';
  }
}