import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PartnerIntelligenceService } from "../../../core/services/partner-intelligence.service";
import { AnomalyAlert, ForecastSnapshot, PartnerInsightSummary, PartnerIntelligenceOverview, RecommendationItem } from "../../../core/models/partner-intelligence.models";
import { RecommendationReviewModalComponent } from "./recommendation-review-modal.component";

@Component({
  selector: "app-partner-intelligence",
  standalone: true,
  imports: [CommonModule, FormsModule, RecommendationReviewModalComponent],
  templateUrl: "./partner-intelligence.component.html",
  styleUrl: "./partner-intelligence.component.css"
})
export class PartnerIntelligenceComponent implements OnInit {
  private readonly svc = inject(PartnerIntelligenceService);
  partnerId = 1;
  overview: PartnerIntelligenceOverview | null = null;
  recommendations: RecommendationItem[] = [];
  anomalies: AnomalyAlert[] = [];
  forecasts: ForecastSnapshot[] = [];
  summaries: PartnerInsightSummary[] = [];
  selectedRecommendation: RecommendationItem | null = null;

  ngOnInit(): void { this.refreshAll(false); }

  refreshAll(forceRefresh: boolean): void {
    this.refreshOverview(forceRefresh);
    this.refreshRecommendations(forceRefresh);
    this.refreshAnomalies(forceRefresh);
    this.refreshForecasts();
    this.refreshSummaries(forceRefresh);
  }

  refreshOverview(forceRefresh = false): void {
    this.overview = null;
    this.svc.runInference(this.partnerId, forceRefresh).subscribe(v => this.overview = v);
  }

  refreshRecommendations(forceRefresh = false): void {
    this.svc.getRecommendations(this.partnerId, forceRefresh).subscribe(v => this.recommendations = v);
  }

  refreshAnomalies(forceRefresh = false): void {
    this.svc.getAnomalies(forceRefresh).subscribe(v => this.anomalies = v);
  }

  refreshForecasts(): void {
    this.svc.getForecasts().subscribe(v => this.forecasts = v);
  }

  refreshSummaries(forceRefresh = false): void {
    this.summaries = [];
    this.svc.getSummaries(forceRefresh).subscribe(v => this.summaries = v);
  }

  onDecision(ev: { id: number; decision: "APPROVED" | "REJECTED"; comment: string }): void {
    this.svc.decide(ev.id, ev.decision, ev.comment).subscribe(() => {
      this.selectedRecommendation = null;
      this.refreshRecommendations(true);
    });
  }
}
