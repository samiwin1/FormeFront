import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../../core/services/feedback.service';
import { Feedback, FeedbackResponse, FEEDBACK_CATEGORIES } from '../../../core/models/feedback.models';

@Component({
  selector: 'app-partner-feedbacks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-feedbacks.component.html',
})
export class PartnerFeedbacksComponent implements OnInit {

  private auth = inject(AuthService);
  private feedbackService = inject(FeedbackService);

  feedbacks: Feedback[] = [];
  categories = FEEDBACK_CATEGORIES;

  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  activeView: 'list' | 'form' = 'list';

  form: Feedback = { rating: 3, category: 'OVERALL' };

  selectedFeedback: Feedback | null = null;
  feedbackResponse: FeedbackResponse | null = null;
  showResponseModal = false;

  private partnerId: number | null = null;

  ngOnInit(): void {
    this.partnerId = this.auth.getUserId();
    this.load();
  }

  load(): void {
    if (!this.partnerId) return;
    this.loading = true;
    this.feedbackService.getByPartner(this.partnerId).subscribe({
      next: (data) => {
        this.feedbacks = data.sort((a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  openForm(): void {
    this.form = { rating: 3, category: 'OVERALL', partnerId: this.partnerId ?? undefined };
    this.errorMessage = '';
    this.activeView = 'form';
  }

  cancelForm(): void {
    this.activeView = 'list';
    this.errorMessage = '';
  }

  submit(): void {
    if (!this.form.title?.trim() || !this.form.comment?.trim() || !this.form.rating) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    const payload: Feedback = { ...this.form, partnerId: this.partnerId ?? undefined };
    this.feedbackService.create(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = 'Your feedback has been submitted successfully!';
        this.activeView = 'list';
        this.load();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: () => {
        this.errorMessage = 'Failed to submit. Please try again.';
        this.submitting = false;
      }
    });
  }

  viewResponse(f: Feedback): void {
    this.selectedFeedback = f;
    this.feedbackResponse = null;
    this.showResponseModal = true;
    this.feedbackService.getResponse(f.id!).subscribe({
      next: (r) => this.feedbackResponse = r,
      error: () => this.feedbackResponse = null
    });
  }

  setRating(value: number): void {
    this.form.rating = value;
  }

  stars(rating?: number): string {
    if (!rating) return '☆☆☆☆☆';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  sentimentClass(s?: string): string {
    if (s === 'POSITIVE') return 'text-success';
    if (s === 'NEGATIVE') return 'text-danger';
    return 'text-secondary';
  }

  sentimentIcon(s?: string): string {
    if (s === 'POSITIVE') return 'feather-smile';
    if (s === 'NEGATIVE') return 'feather-frown';
    return 'feather-meh';
  }

  statusBadge(s?: string): string {
    if (s === 'APPROVED') return 'badge bg-success';
    if (s === 'REJECTED') return 'badge bg-danger';
    return 'badge bg-warning text-dark';
  }
}