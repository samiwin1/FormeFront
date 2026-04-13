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

  // CRUD FORM
  showForm = false;
  isEdit = false;

  form: Feedback = {
    title: '',
    comment: '',
    rating: 0,
    category: ''
  };

  // =============================
  // INIT
  // =============================

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  // =============================
  // LOAD DATA
  // =============================

  load(): void {
    this.loading = true;

    this.feedbackService.getAll().subscribe({
      next: (data) => {
        this.feedbacks = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.feedbackService.getStats().subscribe({
      next: (s) => this.stats = s,
      error: (err) => console.error(err)
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

  // =============================
  // CRUD
  // =============================

  openAdd(): void {
    this.showForm = true;
    this.isEdit = false;
    this.form = { title: '', comment: '', rating: 0, category: '' };
  }

  edit(f: Feedback): void {
    this.form = { ...f };
    this.isEdit = true;
    this.showForm = true;
  }

  save(): void {
    if (this.isEdit && this.form.id) {
      this.feedbackService.update(this.form.id, this.form).subscribe({
        next: () => {
          alert('Updated!');
          this.afterSave();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.feedbackService.create(this.form).subscribe({
        next: () => {
          alert('Created!');
          this.afterSave();
        },
        error: (err) => console.error(err)
      });
    }
  }

  afterSave(): void {
    this.showForm = false;
    this.load();
    this.loadStats();
  }

  // =============================
  // DETAIL
  // =============================

  openDetail(f: Feedback): void {
    this.selectedFeedback = f;
    this.showDetailModal = true;

    this.feedbackService.getResponse(f.id!).subscribe({
      next: (r) => this.feedbackResponse = r,
      error: () => this.feedbackResponse = null
    });
  }

  // =============================
  // APPROVE / REJECT
  // =============================

  approve(id: number): void {
    this.feedbackService.approve(id).subscribe({
      next: (updated) => {
        this.updateInList(updated);
      },
      error: (err) => console.error(err)
    });
  }

  reject(id: number): void {
    this.feedbackService.reject(id).subscribe({
      next: (updated) => {
        this.updateInList(updated);
      },
      error: (err) => console.error(err)
    });
  }

  // =============================
  // DELETE
  // =============================

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  doDelete(): void {
    if (!this.deleteId) return;

    this.feedbackService.delete(this.deleteId).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.load();
      },
      error: (err) => console.error(err)
    });
  }

  // =============================
  // 🤖 AI RESPONSE
  // =============================

  suggest(id: number): void {
    console.log("AI Suggest ID:", id);

    this.feedbackService.suggestAiResponse(id).subscribe({
      next: (res) => {
        console.log("AI OK:", res);
        alert("AI suggestion generated ✅");
        this.load();
      },
      error: (err) => {
        console.error("AI ERROR:", err);
        alert("AI failed ❌");
      }
    });
  }

  accept(id: number): void {
    console.log("Accept ID:", id);

    this.feedbackService.acceptSuggestion(id).subscribe({
      next: () => {
        alert("Email sent ✅");
        this.load();
      },
      error: (err) => {
        console.error("ACCEPT ERROR:", err);
        alert("Accept failed ❌");
      }
    });
  }

  customReply(id: number): void {
    const text = prompt("Write your reply:");

    if (!text) return;

    this.feedbackService.writeCustomResponse(id, text).subscribe({
      next: () => {
        alert("Custom reply sent ✅");
        this.load();
      },
      error: (err) => {
        console.error("CUSTOM ERROR:", err);
        alert("Custom failed ❌");
      }
    });
  }

  // =============================
  // HELPERS
  // =============================

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
    if (s === 'POSITIVE') return 'badge bg-success';
    if (s === 'NEGATIVE') return 'badge bg-danger';
    return 'badge bg-secondary';
  }

  sentimentIcon(s?: string): string {
    if (s === 'POSITIVE') return 'feather-smile';
    if (s === 'NEGATIVE') return 'feather-frown';
    return 'feather-meh';
  }

  statusBadge(s?: string): string {
    if (s === 'APPROVED') return 'badge bg-success';
    if (s === 'REJECTED') return 'badge bg-danger';
    return 'badge bg-warning';
  }
}