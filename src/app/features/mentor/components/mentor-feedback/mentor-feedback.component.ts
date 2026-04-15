import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MentorApiService } from '../../services/mentor-api.service';
import { FeedbackRating } from '../../models/mentor.models';

@Component({
  selector: 'app-mentor-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-feedback.component.html',
  styleUrl: './mentor-feedback.component.css',
})
export class MentorFeedbackComponent {
  @Input() sessionId!: number;

  selected: FeedbackRating | null = null;
  showComment = false;
  comment = '';
  submitting = false;
  submitted = false;

  constructor(private mentorApi: MentorApiService) {}

  rate(rating: FeedbackRating): void {
    if (this.submitting || this.submitted) return;
    this.selected = rating;
    if (rating === 'UP') {
      this.submit();
    } else {
      this.showComment = true;
    }
  }

  submit(): void {
    if (this.submitting || this.submitted || !this.selected) return;
    this.submitting = true;
    this.mentorApi.submitFeedback(this.sessionId, this.selected, this.comment.trim() || undefined)
      .subscribe({
        next: () => {
          this.submitting = false;
          this.submitted = true;
          this.showComment = false;
        },
        error: () => {
          this.submitting = false;
          // Allow retry on error
          this.selected = null;
          this.showComment = false;
        },
      });
  }
}
