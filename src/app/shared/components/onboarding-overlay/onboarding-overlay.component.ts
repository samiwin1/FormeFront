import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { OnboardingService } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-onboarding-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-overlay.component.html',
  styleUrl: './onboarding-overlay.component.css'
})
export class OnboardingOverlayComponent {
  readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly focusRect = signal<DOMRect | null>(null);
  readonly cardPulse = signal(false);
  readonly cardStyle = computed(() => {
    const rect = this.focusRect();
    if (!rect) {
      return { right: '20px', bottom: '20px' };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(430, vw - 24);
    const gap = 16;

    const placeLeft = rect.left + rect.width / 2 > vw * 0.58;
    const placeTop = rect.top + rect.height / 2 > vh * 0.58;

    let left = placeLeft ? rect.left - cardWidth - gap : rect.right + gap;
    left = Math.max(12, Math.min(left, vw - cardWidth - 12));

    let top = placeTop ? rect.top - 210 - gap : rect.bottom + gap;
    top = Math.max(12, Math.min(top, vh - 230));

    return {
      left: `${left}px`,
      top: `${top}px`,
      right: 'auto',
      bottom: 'auto',
    };
  });

  constructor() {
    effect(() => {
      this.onboarding.active();
      this.onboarding.stepIndex();
      this.refreshTargetLater();
      this.replayCardAnimation();
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.refreshTargetLater();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.refreshTarget();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.onboarding.active()) {
      this.refreshTarget();
    }
  }

  private replayCardAnimation(): void {
    this.cardPulse.set(false);
    setTimeout(() => this.cardPulse.set(true), 0);
  }

  private refreshTargetLater(): void {
    setTimeout(() => this.refreshTarget(), 90);
  }

  private refreshTarget(): void {
    if (!this.onboarding.active()) {
      this.focusRect.set(null);
      return;
    }

    const selector = this.onboarding.currentStep()?.targetSelector;
    if (!selector) {
      this.focusRect.set(null);
      return;
    }

    const target = document.querySelector(selector) as HTMLElement | null;
    if (!target) {
      this.focusRect.set(null);
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.focusRect.set(null);
      return;
    }

    this.focusRect.set(rect);
  }
}
