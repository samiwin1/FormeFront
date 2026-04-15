import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { BookmarkedAdviceDto, MentorChannel } from '../../models/mentor.models';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-mentor-bookmarks',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mentor-bookmarks.component.html',
  styleUrl: './mentor-bookmarks.component.css',
})
export class MentorBookmarksComponent implements OnInit {
  loading = true;
  rows: BookmarkedAdviceDto[] = [];
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  removing = new Set<number>();

  selectedItem: BookmarkedAdviceDto | null = null;
  selectedJson: object | null = null;

  constructor(
    private api: MentorApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.api.getBookmarks(this.page, this.size).subscribe({
      next: p => {
        this.rows = p.content ?? [];
        this.totalPages = p.totalPages ?? 0;
        this.totalElements = p.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Could not load bookmarks');
        this.loading = false;
      },
    });
  }

  removeBookmark(item: BookmarkedAdviceDto, event: Event): void {
    event.stopPropagation();
    this.removing.add(item.sessionId);
    this.api.toggleBookmark(item.sessionId).subscribe({
      next: () => {
        this.removing.delete(item.sessionId);
        this.toastService.success('Bookmark removed');
        this.rows = this.rows.filter(r => r.sessionId !== item.sessionId);
        this.totalElements = Math.max(0, this.totalElements - 1);
      },
      error: () => this.removing.delete(item.sessionId),
    });
  }

  openDetails(item: BookmarkedAdviceDto): void {
    this.selectedItem = item;
    this.selectedJson = this.parseJson(item.structuredJsonPreview) ?? this.parseJson(item.summary);
  }

  closeDetails(): void {
    this.selectedItem = null;
    this.selectedJson = null;
  }

  parseJson(value?: string | null): object | null {
    if (!value) return null;
    try { return JSON.parse(value); } catch { return null; }
  }

  prev(): void {
    if (this.page > 0) { this.page--; this.fetch(); }
  }

  next(): void {
    if (this.page < this.totalPages - 1) { this.page++; this.fetch(); }
  }

  getPaginationEnd(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }

  channelBadgeClass(channel: MentorChannel | string): string {
    switch (channel) {
      case 'ASK': return 'badge-info';
      case 'PRE_EXAM': return 'badge-warning';
      case 'REMEDIATION': return 'badge-danger';
      default: return 'badge-gray';
    }
  }

  channelIcon(channel: MentorChannel | string): string {
    switch (channel) {
      case 'ASK': return 'bi-chat-quote';
      case 'PRE_EXAM': return 'bi-file-earmark-text';
      case 'REMEDIATION': return 'bi-arrow-repeat';
      case 'WEEKLY_BRIEF': return 'bi-calendar-week';
      case 'LEARNING_PATH': return 'bi-map';
      default: return 'bi-question-circle';
    }
  }

  channelLabel(channel: MentorChannel | string): string {
    switch (channel) {
      case 'ASK': return 'Question';
      case 'PRE_EXAM': return 'Pre-Exam';
      case 'REMEDIATION': return 'Remediation';
      case 'WEEKLY_BRIEF': return 'Weekly Brief';
      case 'LEARNING_PATH': return 'Learning Path';
      default: return channel;
    }
  }
}
