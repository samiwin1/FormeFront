import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerBillingService } from '../../../core/services/partner-billing.service';
import { PartnerInvoice } from '../../../core/models/partner-invoice.model';

@Component({
  selector: 'app-partner-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './partner-billing.component.html',
  styleUrls: ['./partner-billing.component.css']
})
export class PartnerBillingComponent implements OnInit {
  invoices: PartnerInvoice[] = [];
  searchTerm = '';
  statusFilter: 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE' = 'ALL';
  currentPage = 1;
  readonly pageSize = 8;
  
  newInvoice: PartnerInvoice = {
    partnerId: 0,
    amount: 0,
    periodStart: '',
    periodEnd: ''
  };

  constructor(private billingService: PartnerBillingService) {}

  ngOnInit(): void {
    this.loadInvoices(false);
  }

  loadInvoices(force = false): void {
    this.billingService.getAllInvoices(force).subscribe({
      next: (data) => {
        this.invoices = data;
      },
      error: (err) => {
        console.error('Error loading partner invoices', err);
      }
    });
  }

  generateInvoice(): void {
    // Convert strings back to numbers just in case ngModel synced them as strings
    const pId = Number(this.newInvoice.partnerId);
    const amt = Number(this.newInvoice.amount);

    if (pId > 0 && amt > 0 && this.newInvoice.periodStart && this.newInvoice.periodEnd) {
      this.newInvoice.partnerId = pId;
      this.newInvoice.amount = amt;

      this.billingService.generateInvoice(this.newInvoice).subscribe({
        next: (invoice) => {
          this.invoices.push(invoice);
          this.newInvoice = {
            partnerId: 0,
            amount: 0,
            periodStart: '',
            periodEnd: ''
          };
        },
        error: (err) => {
          console.error('Error generating invoice', err);
        }
      });
    } else {
      console.warn('Validation failed:', this.newInvoice);
    }
  }

  markAsPaid(id: number): void {
    this.billingService.markAsPaid(id).subscribe({
      next: (updatedInvoice) => {
        const index = this.invoices.findIndex(i => i.id === updatedInvoice.id);
        if (index !== -1) {
          this.invoices[index] = updatedInvoice;
        }
      },
      error: (err) => console.error('Error marking as paid', err)
    });
  }

  get filteredInvoices(): PartnerInvoice[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.invoices.filter((invoice) => {
      const status = (invoice.status || 'PENDING').toUpperCase();
      const statusOk = this.statusFilter === 'ALL' || status === this.statusFilter;
      if (!statusOk) return false;
      if (!term) return true;
      const haystack = [
        String(invoice.id ?? ''),
        invoice.invoiceNumber ?? '',
        String(invoice.partnerId),
        status,
        invoice.details ?? '',
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  get paginatedInvoices(): PartnerInvoice[] {
    const safePage = Math.min(this.currentPage, this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredInvoices.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredInvoices.length / this.pageSize));
  }

  get stats() {
    return {
      total: this.invoices.length,
      pending: this.invoices.filter((i) => (i.status || 'PENDING') === 'PENDING').length,
      paid: this.invoices.filter((i) => i.status === 'PAID').length,
      amountTotal: this.invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
    };
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }
}