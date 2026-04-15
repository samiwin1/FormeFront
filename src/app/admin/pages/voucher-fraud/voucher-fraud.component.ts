import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FraudAlert } from '../../../core/models/fraud-alert.model';
import { VoucherFraudService } from '../../../core/services/voucher-fraud.service';

@Component({
  selector: 'app-voucher-fraud',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './voucher-fraud.component.html',
  styleUrls: ['./voucher-fraud.component.css']
})
export class VoucherFraudComponent implements OnInit {
  alerts: FraudAlert[] = [];
  loading = false;
  searchTerm = '';
  statusFilter: FraudAlert['status'] | 'ALL' = 'ALL';
  minSeverity = 0;
  currentPagePending = 1;
  currentPageResolved = 1;
  readonly pageSize = 8;

  constructor(private fraudService: VoucherFraudService) {}

  ngOnInit(): void {
    this.loadAlerts(false);
  }

  loadAlerts(force = false) {
    this.loading = true;
    this.fraudService.getAllAlerts(force).subscribe({
      next: (res) => {
        this.alerts = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading fraud alerts', err);
        this.loading = false;
      }
    });
  }

  get filteredPendingAlerts(): FraudAlert[] {
    return this.filteredAlerts.filter(a => a.status === 'INVESTIGATION_PENDING');
  }

  get filteredResolvedAlerts(): FraudAlert[] {
    return this.filteredAlerts.filter(a => a.status === 'CONFIRMED' || a.status === 'DISMISSED');
  }

  get filteredAlerts(): FraudAlert[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.alerts.filter((alert) => {
      const statusOk = this.statusFilter === 'ALL' || alert.status === this.statusFilter;
      const severityOk = alert.severityLevel >= this.minSeverity;
      if (!statusOk || !severityOk) return false;
      if (!term) return true;
      const haystack = [
        String(alert.id),
        alert.voucherCode,
        String(alert.partnerId),
        alert.alertType,
        alert.detectionDetails,
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  get paginatedPendingAlerts(): FraudAlert[] {
    const safePage = Math.min(this.currentPagePending, this.totalPendingPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredPendingAlerts.slice(start, start + this.pageSize);
  }

  get totalPendingPages(): number {
    return Math.max(1, Math.ceil(this.filteredPendingAlerts.length / this.pageSize));
  }

  get paginatedResolvedAlerts(): FraudAlert[] {
    const safePage = Math.min(this.currentPageResolved, this.totalResolvedPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredResolvedAlerts.slice(start, start + this.pageSize);
  }

  get totalResolvedPages(): number {
    return Math.max(1, Math.ceil(this.filteredResolvedAlerts.length / this.pageSize));
  }

  get stats() {
    return {
      total: this.alerts.length,
      pending: this.alerts.filter((a) => a.status === 'INVESTIGATION_PENDING').length,
      confirmed: this.alerts.filter((a) => a.status === 'CONFIRMED').length,
      highSeverity: this.alerts.filter((a) => a.severityLevel >= 4).length,
    };
  }

  onFilterChange(): void {
    this.currentPagePending = 1;
    this.currentPageResolved = 1;
  }

  nextPendingPage(): void {
    this.currentPagePending = Math.min(this.totalPendingPages, this.currentPagePending + 1);
  }

  previousPendingPage(): void {
    this.currentPagePending = Math.max(1, this.currentPagePending - 1);
  }

  nextResolvedPage(): void {
    this.currentPageResolved = Math.min(this.totalResolvedPages, this.currentPageResolved + 1);
  }

  previousResolvedPage(): void {
    this.currentPageResolved = Math.max(1, this.currentPageResolved - 1);
  }

  updateStatus(id: number, status: string) {
    this.fraudService.updateStatus(id, status).subscribe({
      next: () => {
        this.loadAlerts(true);
      },
      error: (err) => console.error('Error updating fraud alert status', err)
    });
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'INVESTIGATION_PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'DISMISSED': return 'status-dismissed';
      default: return 'status-pending';
    }
  }
}
