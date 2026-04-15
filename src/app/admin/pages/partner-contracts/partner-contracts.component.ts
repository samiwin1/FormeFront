import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PartnerContract } from '../../../core/models/partner-contract.model';
import { PartnerContractService } from '../../../core/services/partner-contract.service';

@Component({
  selector: 'app-partner-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './partner-contracts.component.html',
  styleUrls: ['./partner-contracts.component.css']
})
export class PartnerContractsComponent implements OnInit {
  contracts: PartnerContract[] = [];
  loading = false;
  createError = '';
  creating = false;
  showCreateForm = false;
  searchTerm = '';
  statusFilter: PartnerContract['status'] | 'ALL' = 'ALL';
  currentPage = 1;
  readonly pageSize = 8;
  newContract: Partial<PartnerContract> = this.getEmptyContract();

  constructor(private contractService: PartnerContractService) {}

  ngOnInit(): void {
    this.loadContracts(false);
  }

  loadContracts(force = false) {
    this.loading = true;
    this.contractService.getAllContracts(force).subscribe({
      next: (res) => {
        this.contracts = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.showCreateForm = true;
    this.createError = '';
    this.newContract = this.getEmptyContract();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.createError = '';
  }

  createContract(): void {
    const payload: Partial<PartnerContract> = {
      partnerId: Number(this.newContract.partnerId),
      title: (this.newContract.title ?? '').trim(),
      commissionRate: Number(this.newContract.commissionRate),
      startDate: this.newContract.startDate,
      endDate: this.newContract.endDate,
      termsAndConditions: (this.newContract.termsAndConditions ?? '').trim(),
      status: 'DRAFT'
    };

    if (!payload.partnerId || !payload.title || !payload.startDate || !payload.endDate) {
      this.createError = 'Please fill partner, title, start date, and end date.';
      return;
    }

    if ((payload.commissionRate ?? 0) < 0 || (payload.commissionRate ?? 0) > 1) {
      this.createError = 'Commission rate must be between 0 and 1.';
      return;
    }

    this.creating = true;
    this.createError = '';
    this.contractService.createContract(payload).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateForm = false;
        this.loadContracts();
      },
      error: () => {
        this.creating = false;
        this.createError = 'Unable to create contract. Please verify the input and retry.';
      }
    });
  }

  get filteredContracts(): PartnerContract[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.contracts.filter((contract) => {
      const statusOk = this.statusFilter === 'ALL' || contract.status === this.statusFilter;
      if (!statusOk) return false;
      if (!term) return true;
      const haystack = [
        String(contract.id),
        String(contract.partnerId),
        contract.title,
        contract.status,
        contract.termsAndConditions ?? '',
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredContracts.length / this.pageSize));
  }

  get paginatedContracts(): PartnerContract[] {
    const safePage = Math.min(this.currentPage, this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredContracts.slice(start, start + this.pageSize);
  }

  get stats() {
    return {
      total: this.contracts.length,
      active: this.contracts.filter((c) => c.status === 'ACTIVE').length,
      draft: this.contracts.filter((c) => c.status === 'DRAFT').length,
      expiredOrTerminated: this.contracts.filter((c) => c.status === 'EXPIRED' || c.status === 'TERMINATED').length,
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

  updateStatus(id: number, status: string) {
    this.contractService.updateStatus(id, status).subscribe({
      next: () => {
        this.loadContracts();
      },
      error: () => {}
    });
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'ACTIVE': return 'status-active';
      case 'EXPIRED': return 'status-expired';
      case 'TERMINATED': return 'status-terminated';
      default: return 'status-draft';
    }
  }

  private getEmptyContract(): Partial<PartnerContract> {
    return {
      partnerId: 0,
      title: '',
      commissionRate: 0.1,
      startDate: '',
      endDate: '',
      termsAndConditions: ''
    };
  }
}
