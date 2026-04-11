import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeedbackService } from '../../../core/services/feedback.service';
import { Feedback, FeedbackResponse, FeedbackStats } from '../../../core/models/feedback.models';

@Component({
  selector: 'app-feedbacks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feedbacks.component.html',
})
export class FeedbacksComponent implements OnInit {

  private feedbackService = inject(FeedbackService);

  feedbacks: Feedback[] = [];
  filtered: Feedback[] = [];
  stats: FeedbackStats | null = null;

  loading = false;
  searchTerm = '';
  filterStatus = '';

  selectedFeedback: Feedback | null = null;
  feedbackResponse: FeedbackResponse | null = null;
  showDetailModal = false;
  showCustomForm = false;
  customResponseText = '';
  loadingResponse = false;
  responseSuccess = '';
  responseError = '';

  deleteId: number | null = null;
  showDeleteModal = false;

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  load(): void {
    this.loading = true;
    this.feedbackService.getAll().subscribe({
      next: (data) => {
        this.feedbacks = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadStats(): void {
    this.feedbackService.getStats().subscribe({
      next: (s) => this.stats = s,
      error: () => {}
    });
  }

  applyFilter(): void {
    let list = [...this.feedbacks];
    if (this.filterStatus) {
      list = list.filter(f => f.status === this.filterStatus);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(f =>
        f.title?.toLowerCase().includes(term) ||
        f.comment?.toLowerCase().includes(term) ||
        f.category?.toLowerCase().includes(term)
      );
    }
    this.filtered = list;
  }

  openDetail(f: Feedback): void {
    this.selectedFeedback = f;
    this.feedbackResponse = null;
    this.showCustomForm = false;
    this.customResponseText = '';
    this.responseSuccess = '';
    this.responseError = '';
    this.showDetailModal = true;
    this.feedbackService.getResponse(f.id!).subscribe({
      next: (r) => this.feedbackResponse = r,
      error: () => this.feedbackResponse = null
    });
  }

  approve(id: number): void {
    this.feedbackService.approve(id).subscribe({
      next: (updated) => {
        this.updateInList(updated);
        if (this.selectedFeedback?.id === id) this.selectedFeedback = updated;
      }
    });
  }

  reject(id: number): void {
    this.feedbackService.reject(id).subscribe({
      next: (updated) => {
        this.updateInList(updated);
        if (this.selectedFeedback?.id === id) this.selectedFeedback = updated;
      }
    });
  }

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  doDelete(): void {
    if (!this.deleteId) return;
    this.feedbackService.delete(this.deleteId).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.showDetailModal = false;
        this.deleteId = null;
        this.load();
        this.loadStats();
      }
    });
  }

  suggestAi(): void {
    if (!this.selectedFeedback?.id) return;
    this.loadingResponse = true;
    this.responseError = '';
    this.feedbackService.suggestAiResponse(this.selectedFeedback.id).subscribe({
      next: (r) => {
        this.feedbackResponse = r;
        this.loadingResponse = false;
        this.responseSuccess = 'AI suggestion generated!';
        setTimeout(() => this.responseSuccess = '', 3000);
      },
      error: () => {
        this.responseError = 'Failed to generate suggestion.';
        this.loadingResponse = false;
      }
    });
  }

  acceptSuggestion(): void {
    if (!this.selectedFeedback?.id) return;
    this.feedbackService.acceptSuggestion(this.selectedFeedback.id).subscribe({
      next: (r) => {
        this.feedbackResponse = r;
        this.responseSuccess = 'Response sent to partner!';
        setTimeout(() => this.responseSuccess = '', 3000);
      }
    });
  }

  submitCustom(): void {
    if (!this.selectedFeedback?.id || !this.customResponseText.trim()) return;
    this.feedbackService.writeCustomResponse(this.selectedFeedback.id, this.customResponseText).subscribe({
      next: (r) => {
        this.feedbackResponse = r;
        this.showCustomForm = false;
        this.customResponseText = '';
        this.responseSuccess = 'Response sent!';
        setTimeout(() => this.responseSuccess = '', 3000);
      }
    });
  }

  private updateInList(updated: Feedback): void {
    const i = this.feedbacks.findIndex(f => f.id === updated.id);
    if (i > -1) this.feedbacks[i] = updated;
    this.applyFilter();
  }

  stars(rating?: number): string {
    if (!rating) return '☆☆☆☆☆';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  sentimentBadge(s?: string): string {
    if (s === 'POSITIVE') return 'badge bg-success-subtle text-success';
    if (s === 'NEGATIVE') return 'badge bg-danger-subtle text-danger';
    return 'badge bg-secondary-subtle text-secondary';
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