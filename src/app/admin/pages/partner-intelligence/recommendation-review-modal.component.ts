import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RecommendationItem } from "../../../core/models/partner-intelligence.models";

@Component({
  selector: "app-recommendation-review-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="card mt-3" *ngIf="item">
    <div class="card-body">
      <h5 class="mb-2">Review Recommendation</h5>
      <div class="fw-semibold">{{ item.actionTitle }}</div>
      <p class="text-muted">{{ item.rationale }}</p>
      <textarea class="form-control mb-2" [(ngModel)]="comment" rows="2" placeholder="Comment..."></textarea>
      <button class="btn btn-success me-2" (click)="onDecision('APPROVED')">Approve</button>
      <button class="btn btn-outline-danger" (click)="onDecision('REJECTED')">Reject</button>
    </div>
  </div>
  `
})
export class RecommendationReviewModalComponent {
  @Input() item: RecommendationItem | null = null;
  @Output() decision = new EventEmitter<{ id: number; decision: "APPROVED" | "REJECTED"; comment: string }>();
  comment = "";

  onDecision(decision: "APPROVED" | "REJECTED"): void {
    if (!this.item) return;
    this.decision.emit({ id: this.item.id, decision, comment: this.comment });
  }
}
