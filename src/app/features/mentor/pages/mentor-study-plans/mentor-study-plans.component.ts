import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import {
  ItemCompleteResponseDto,
  StudyPlanItemResponseDto,
  StudyPlanResponseDto,
  StreakResponseDto,
} from '../../models/mentor.models';

@Component({
  selector: 'app-mentor-study-plans',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mentor-study-plans.component.html',
  styleUrl: './mentor-study-plans.component.css',
})
export class MentorStudyPlansComponent implements OnInit {
  plans: StudyPlanResponseDto[] = [];
  selectedPlan: StudyPlanResponseDto | null = null;
  loading = false;
  error: string | null = null;
  streak: StreakResponseDto | null = null;
  itemsCompletedToday = 0;
  toast: { message: string; streak: number; planComplete: boolean } | null = null;

  constructor(private mentorApi: MentorApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.mentorApi.getStudyPlans().subscribe({
      next: plans => {
        this.plans = plans;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error ?? err?.message ?? 'Could not load study plans';
        this.loading = false;
      },
    });
    this.mentorApi.getStreak().subscribe({
      next: s => (this.streak = s),
    });
  }

  markCompleted(item: StudyPlanItemResponseDto): void {
    if (item.completed) return;
    this.mentorApi.completeStudyPlanItem(item.id).subscribe({
      next: (res: ItemCompleteResponseDto) => {
        item.completed = true;
        this.itemsCompletedToday++;
        if (this.streak) {
          this.streak = { ...this.streak, currentStreak: res.currentStreak };
        }
        const planComplete = res.planComplete ?? false;
        this.toast = { message: res.message, streak: res.currentStreak, planComplete };
        setTimeout(() => (this.toast = null), planComplete ? 7000 : 4500);
      },
    });
  }

  completedCount(plan: StudyPlanResponseDto): number {
    return plan.items.filter(i => i.completed).length;
  }

  channelLabel(channel: string | null | undefined): string {
    switch (channel) {
      case 'ASK':           return 'Ask mentor';
      case 'PRE_EXAM':      return 'Pre-exam';
      case 'LEARNING_PATH': return 'Learning path';
      case 'REMEDIATION':   return 'Remediation';
      default:              return channel ?? '—';
    }
  }

  channelBadgeClass(channel: string | null | undefined): string {
    switch (channel) {
      case 'ASK':          return 'badge-ask';
      case 'PRE_EXAM':     return 'badge-pre-exam';
      case 'REMEDIATION':  return 'badge-remediation';
      default:             return 'badge-secondary';
    }
  }

  getPlanDuration(plan: StudyPlanResponseDto): number {
    return plan.items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  }

  openPlanDetails(plan: StudyPlanResponseDto): void {
    this.selectedPlan = plan;
  }

  closePlanDetails(): void {
    this.selectedPlan = null;
  }
}
