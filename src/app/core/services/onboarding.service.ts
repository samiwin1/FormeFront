import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface OnboardingStep {
  route: string;
  title: string;
  description: string;
  targetSelector?: string;
}

interface UserOnboardingState {
  firstLoginAt: number;
  autoStartedOnce?: boolean;
  completedAt?: number;
  lastStartedAt?: number;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly storagePrefix = 'forme_onboarding_v1_';
  private pendingAutoStart = false;

  readonly active = signal(false);
  readonly steps = signal<OnboardingStep[]>([]);
  readonly stepIndex = signal(0);
  readonly currentStep = computed(() => this.steps()[this.stepIndex()] ?? null);
  readonly progressLabel = computed(() => {
    const total = this.steps().length;
    const idx = this.stepIndex() + 1;
    return total > 0 ? `${idx}/${total}` : '0/0';
  });

  registerLoginAndScheduleAutoStart(): void {
    const key = this.userKey();
    if (!key) return;

    const state = this.readState(key) ?? { firstLoginAt: Date.now() };
    if (!state.firstLoginAt) {
      state.firstLoginAt = Date.now();
    }

    this.writeState(key, state);

    if (!state.autoStartedOnce) {
      this.pendingAutoStart = true;
    }
  }

  startIfPendingAfterLogin(): void {
    if (!this.pendingAutoStart) {
      return;
    }

    const key = this.userKey();
    if (!key) {
      this.pendingAutoStart = false;
      return;
    }

    const state = this.readState(key);
    if (!state) {
      this.pendingAutoStart = false;
      return;
    }

    state.autoStartedOnce = true;
    state.lastStartedAt = Date.now();
    this.writeState(key, state);
    this.pendingAutoStart = false;

    this.startTour(true);
  }

  canShowHeaderEntry(): boolean {
    if (!this.auth.getToken()) return false;
    const state = this.currentState();
    if (!state?.firstLoginAt) return false;
    return Date.now() - state.firstLoginAt <= 3 * 24 * 60 * 60 * 1000;
  }

  startTour(fromAutoStart = false): void {
    const key = this.userKey();
    if (!key) return;

    const state = this.readState(key) ?? { firstLoginAt: Date.now() };
    if (!state.firstLoginAt) {
      state.firstLoginAt = Date.now();
    }
    state.lastStartedAt = Date.now();
    this.writeState(key, state);

    const generated = this.buildSteps();
    if (!generated.length) {
      return;
    }

    this.steps.set(generated);
    this.stepIndex.set(0);
    this.active.set(true);

    const first = generated[0];
    if (!fromAutoStart || this.router.url !== first.route) {
      void this.router.navigateByUrl(first.route);
    }
  }

  next(): void {
    const idx = this.stepIndex();
    const all = this.steps();
    if (idx >= all.length - 1) {
      this.complete();
      return;
    }

    const nextIndex = idx + 1;
    this.stepIndex.set(nextIndex);
    const nextStep = all[nextIndex];
    if (nextStep) {
      void this.router.navigateByUrl(nextStep.route);
    }
  }

  previous(): void {
    const idx = this.stepIndex();
    if (idx <= 0) return;

    const prev = idx - 1;
    this.stepIndex.set(prev);
    const step = this.steps()[prev];
    if (step) {
      void this.router.navigateByUrl(step.route);
    }
  }

  skip(): void {
    this.active.set(false);
  }

  complete(): void {
    const key = this.userKey();
    if (key) {
      const state = this.readState(key) ?? { firstLoginAt: Date.now() };
      state.completedAt = Date.now();
      this.writeState(key, state);
    }
    this.active.set(false);
  }

  private buildSteps(): OnboardingStep[] {
    const steps: OnboardingStep[] = [
      {
        route: '/',
        title: 'Welcome to ForMe',
        description: 'Start here to discover the full training and certification journey in one place.',
        targetSelector: '[data-ob="home-hero-cta"]',
      },
      {
        route: '/formations',
        title: 'Explore formations',
        description: 'Use search and filters to quickly find the best formation for your goals.',
        targetSelector: '[data-ob="formations-search"]',
      },
      {
        route: '/courses',
        title: 'Shop and enroll',
        description: 'Compare offers, then add to cart or buy immediately from the course cards.',
        targetSelector: '[data-ob="courses-grid"]',
      },
    ];

    if (this.auth.isAdmin()) {
      steps.push(
        {
          route: '/admin/dashboard',
          title: 'Admin dashboard',
          description: 'Monitor core KPIs: certifications, sessions, assignments, and reschedule pressure.',
          targetSelector: '[data-ob="admin-dashboard-kpis"]',
        },
        {
          route: '/admin/oral-sessions',
          title: 'Oral sessions management',
          description: 'Plan oral sessions and coordinate evaluator/learner assignments.',
          targetSelector: '[data-ob="admin-nav-oral-sessions"]',
        },
        {
          route: '/admin/partners',
          title: 'Business area',
          description: 'Track partners, deals, packs, and access codes from a single business workspace.',
          targetSelector: '[data-ob="admin-nav-partners"]',
        }
      );
    } else if (this.auth.isEvaluator()) {
      steps.push({
        route: '/evaluator/oral-assignments',
        title: 'Evaluator workspace',
        description: 'Review your assigned oral evaluations and submit grading.',
        targetSelector: '[data-ob="evaluator-workspace"]',
      });
    } else if (this.auth.isUser()) {
      steps.push({
        route: '/me/certification-space',
        title: 'Certification space',
        description: 'Follow your exam status, certification progress, and upcoming sessions.',
        targetSelector: '[data-ob="learner-space"]',
      });
    }

    steps.push({
      route: '/profile',
      title: 'Settings and profile',
      description: 'You can always relaunch this onboarding from your profile settings.',
      targetSelector: '[data-ob="profile-onboarding-panel"]',
    });

    return steps;
  }

  private currentState(): UserOnboardingState | null {
    const key = this.userKey();
    if (!key) return null;
    return this.readState(key);
  }

  private userKey(): string | null {
    const uid = this.auth.getUserId();
    if (uid != null) {
      return `${this.storagePrefix}uid_${uid}`;
    }

    const email = this.auth.getEmail();
    if (!email) return null;
    return `${this.storagePrefix}email_${email.toLowerCase()}`;
  }

  private readState(key: string): UserOnboardingState | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserOnboardingState;
    } catch {
      return null;
    }
  }

  private writeState(key: string, state: UserOnboardingState): void {
    localStorage.setItem(key, JSON.stringify(state));
  }
}
