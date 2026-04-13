import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BusinessService, PartnerWithStats, PartnerStats } from '../../../core/services/business.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  private businessService = inject(BusinessService);

  // ── Compteurs globaux ───────────────────────────────────────────────────
  totalPartners = 0;
  totalDeals    = 0;
  totalPacks    = 0;
  totalCodes    = 0;
  activeCodesCount  = 0;
  expiredCodesCount = 0;
  usedCodesCount    = 0;

  loadingGlobal = true;

  // ── Tableau partenaires + stats ─────────────────────────────────────────
  partners: PartnerWithStats[] = [];
  loadingPartners = true;

  ngOnInit(): void {
    this.loadGlobalCounts();
    this.loadPartnerStats();
  }

  // ✅ Charge tous les compteurs globaux en parallèle
  loadGlobalCounts(): void {
    forkJoin({
      partners: this.businessService.getPartners(),
      deals:    this.businessService.getDeals(),
      packs:    this.businessService.getPacks(),
      codes:    this.businessService.getAccessCodes(),
    }).subscribe({
      next: ({ partners, deals, packs, codes }) => {
        this.totalPartners = partners.length;
        this.totalDeals    = deals.length;
        this.totalPacks    = packs.length;
        this.totalCodes    = codes.length;

        const today = new Date();
        this.activeCodesCount  = codes.filter(c => !c.used && new Date(c.expirationDate) >= today).length;
        this.expiredCodesCount = codes.filter(c => !c.used && new Date(c.expirationDate) < today).length;
        this.usedCodesCount    = codes.filter(c => c.used).length;

        this.loadingGlobal = false;
      },
      error: () => { this.loadingGlobal = false; }
    });
  }

  // ✅ Charge chaque partenaire puis appelle /stats pour chacun
  loadPartnerStats(): void {
    this.businessService.getPartners().subscribe({
      next: (partners) => {
        this.partners = partners.map(p => ({ ...p, loadingStats: true }));
        this.loadingPartners = false;

        // Appel stats pour chaque partenaire individuellement
        this.partners.forEach((partner, index) => {
          this.businessService.getPartnerStats(partner.id!).subscribe({
            next: (stats: PartnerStats) => {
              this.partners[index] = { ...this.partners[index], stats, loadingStats: false };
            },
            error: () => {
              this.partners[index] = {
                ...this.partners[index],
                stats: { totalDeals: 0, usedCodes: 0 },
                loadingStats: false
              };
            }
          });
        });
      },
      error: () => { this.loadingPartners = false; }
    });
  }

  // ✅ Couleur dynamique selon activité du partenaire
  getActivityLevel(stats?: PartnerStats): 'high' | 'medium' | 'low' {
    if (!stats) return 'low';
    const total = stats.totalDeals + stats.usedCodes;
    if (total >= 10) return 'high';
    if (total >= 3)  return 'medium';
    return 'low';
  }

  getActivityBadge(stats?: PartnerStats): string {
    const level = this.getActivityLevel(stats);
    return { high: 'bg-success', medium: 'bg-warning', low: 'bg-secondary' }[level];
  }

  getActivityLabel(stats?: PartnerStats): string {
    const level = this.getActivityLevel(stats);
    return { high: 'High', medium: 'Medium', low: 'Low' }[level];
  }
}