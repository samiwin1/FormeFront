import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MentorApiService } from '../../services/mentor-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ApiErrorBody,
  DepthVsBreadth,
  DevicePrimary,
  ExamAttemptContext,
  ExamFormatPreference,
  ExperienceLevel,
  ExplanationStyle,
  HeldCertificationDto,
  LearningStyle,
  MentorExtendedPreferences,
  MockExamFrequency,
  PortfolioResponseDto,
  PortfolioUpsertRequest,
  PrimaryGoal,
  ReminderStyle,
  SelfAssessedSkillLevel,
  SkillUpsertDto,
  StreakSensitivity,
  StudyModeForExams,
  StudyWindow,
  TargetCertificationDto,
  emptyMentorExtendedPreferences,
} from '../../models/mentor.models';

@Component({
  selector: 'app-portfolio-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './portfolio-edit.component.html',
  styleUrl: './portfolio-edit.component.css',
})
export class PortfolioEditComponent implements OnInit {
  loading = true;
  saving = false;

  // Optional section open/close state
  showCerts = false;
  showSchedule = false;
  showMotivation = false;
  showHowLearn = false;
  showSkills = false;

  private readonly toastService = inject(ToastService);

  currentRole = '';
  targetRole = '';
  experienceLevel: ExperienceLevel = 'BEGINNER';
  bio = '';
  weeklyStudyHours: number | null = null;
  preferredLanguage = '';
  learningStyle: LearningStyle = 'VISUAL';
  skills: SkillUpsertDto[] = [];

  ext: MentorExtendedPreferences = emptyMentorExtendedPreferences();
  /** Comma-separated formation IDs for simple binding */
  linkedFormationIdsInput = '';
  /** Comma-separated locale codes (e.g. en, fr) */
  preferredResourceLocalesInput = '';

  readonly experienceLevels: ExperienceLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  readonly learningStyles: LearningStyle[] = ['VISUAL', 'READING', 'HANDS_ON', 'VIDEO'];
  readonly skillLevels: SelfAssessedSkillLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

  readonly examFormats: ExamFormatPreference[] = ['PROCTORED', 'TAKE_HOME', 'PRACTICAL', 'ANY'];
  readonly examAttempts: ExamAttemptContext[] = ['FIRST_ATTEMPT', 'RETAKE'];
  readonly studyModes: StudyModeForExams[] = ['CRAM', 'LONG_PREP'];
  readonly mockFreqs: MockExamFrequency[] = ['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
  readonly studyWindowsAll: StudyWindow[] = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  readonly devices: DevicePrimary[] = ['MOBILE', 'DESKTOP', 'MIXED'];
  readonly primaryGoals: PrimaryGoal[] = ['JOB_CHANGE', 'PROMOTION', 'EXAM_PASS', 'CURIOSITY', 'OTHER'];
  readonly reminderStyles: ReminderStyle[] = ['NONE', 'LIGHT', 'STRICT'];
  readonly streakSensitivities: StreakSensitivity[] = ['LOW', 'MEDIUM', 'HIGH'];
  readonly depthBreadth: DepthVsBreadth[] = ['DEPTH', 'BREADTH', 'BALANCED'];
  readonly explanationStyles: ExplanationStyle[] = ['ANALOGY', 'STEPS', 'MATH_HEAVY', 'LABS'];

  constructor(private mentorApi: MentorApiService) {}

  ngOnInit(): void {
    this.mentorApi
      .portfolioExists()
      .pipe(
        switchMap(({ exists }) =>
          exists ? this.mentorApi.getPortfolio() : of(null as PortfolioResponseDto | null)
        )
      )
      .subscribe({
        next: p => {
          if (!p) {
            this.skills = [];
            this.ext = emptyMentorExtendedPreferences();
            this.linkedFormationIdsInput = '';
            this.preferredResourceLocalesInput = '';
            this.loading = false;
            return;
          }
          this.currentRole = p.currentRole ?? '';
          this.targetRole = p.targetRole ?? '';
          this.experienceLevel = p.experienceLevel;
          this.bio = p.bio ?? '';
          this.weeklyStudyHours = p.weeklyStudyHours ?? null;
          this.preferredLanguage = p.preferredLanguage ?? '';
          this.learningStyle = p.learningStyle;
          this.skills = (p.skills ?? []).map(s => ({ skillName: s.skillName, level: s.level }));
          this.ext = this.mergeExtended(p.extendedPreferences);
          this.linkedFormationIdsInput = (this.ext.linkedFormationIds ?? []).join(', ');
          this.preferredResourceLocalesInput = (this.ext.preferredResourceLocales ?? []).join(', ');
          // Auto-open optional sections that already have data
          this.showCerts = this.hasCertData();
          this.showSchedule = this.hasScheduleData();
          this.showMotivation = this.hasMotivationData();
          this.showHowLearn = this.hasHowLearnData();
          this.showSkills = this.skills.length > 0;
          this.loading = false;
        },
        error: err => {
          const details = err as { status?: number; error?: ApiErrorBody; message?: string };
          if (details.status === 404) {
            this.skills = [];
            this.ext = emptyMentorExtendedPreferences();
          } else {
            this.toastService.error(details.error?.error ?? details.message ?? 'Could not load profile');
          }
          this.loading = false;
        },
      });
  }

  private mergeExtended(from: MentorExtendedPreferences | null | undefined): MentorExtendedPreferences {
    const d = emptyMentorExtendedPreferences();
    if (!from) {
      return d;
    }
    return {
      ...d,
      ...from,
      targetCertifications: [...(from.targetCertifications ?? [])],
      heldCertifications: [...(from.heldCertifications ?? [])],
      studyWindows: [...(from.studyWindows ?? [])],
      preferredResourceLocales: [...(from.preferredResourceLocales ?? [])],
      linkedFormationIds: [...(from.linkedFormationIds ?? [])],
    };
  }

  toggleStudyWindow(w: StudyWindow): void {
    const cur = [...(this.ext.studyWindows ?? [])];
    const i = cur.indexOf(w);
    if (i >= 0) {
      cur.splice(i, 1);
    } else {
      cur.push(w);
    }
    this.ext = { ...this.ext, studyWindows: cur };
  }

  hasStudyWindow(w: StudyWindow): boolean {
    return (this.ext.studyWindows ?? []).includes(w);
  }

  addTargetCert(): void {
    const list = [...(this.ext.targetCertifications ?? [])];
    list.push({ name: '', provider: '', targetExamDate: '' });
    this.ext = { ...this.ext, targetCertifications: list };
  }

  removeTargetCert(i: number): void {
    const list = [...(this.ext.targetCertifications ?? [])];
    list.splice(i, 1);
    this.ext = { ...this.ext, targetCertifications: list };
  }

  addHeldCert(): void {
    const list = [...(this.ext.heldCertifications ?? [])];
    list.push({ name: '', year: null });
    this.ext = { ...this.ext, heldCertifications: list };
  }

  removeHeldCert(i: number): void {
    const list = [...(this.ext.heldCertifications ?? [])];
    list.splice(i, 1);
    this.ext = { ...this.ext, heldCertifications: list };
  }

  trackTarget(_i: number, row: TargetCertificationDto): string {
    return `${row.name}-${_i}`;
  }

  trackHeld(_i: number, row: HeldCertificationDto): string {
    return `${row.name}-${_i}`;
  }

  addSkill(): void {
    this.skills.push({ skillName: '', level: 'MEDIUM' });
  }

  removeSkill(i: number): void {
    this.skills.splice(i, 1);
  }

  private buildExtendedForSave(): MentorExtendedPreferences {
    const t = (this.ext.targetCertifications ?? [])
      .filter(s => s.name.trim().length > 0)
      .map(s => ({
        name: s.name.trim(),
        provider: s.provider?.trim() || null,
        targetExamDate: s.targetExamDate?.trim() || null,
      }));
    const h = (this.ext.heldCertifications ?? [])
      .filter(s => s.name.trim().length > 0)
      .map(s => ({
        name: s.name.trim(),
        year: s.year != null && !Number.isNaN(Number(s.year)) ? Number(s.year) : null,
      }));
    const formationIds = this.linkedFormationIdsInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !Number.isNaN(n));
    const locales = this.preferredResourceLocalesInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    return {
      ...this.ext,
      targetCertifications: t,
      heldCertifications: h,
      preferredResourceLocales: locales,
      linkedFormationIds: formationIds,
    };
  }

  hasCertData(): boolean {
    return (this.ext.targetCertifications?.length ?? 0) > 0 ||
           (this.ext.heldCertifications?.length ?? 0) > 0 ||
           !!this.ext.examFormatPreference ||
           !!this.ext.examAttemptContext;
  }

  hasScheduleData(): boolean {
    return !!this.ext.timezone ||
           (this.ext.studyWindows?.length ?? 0) > 0 ||
           !!this.ext.devicePrimary;
  }

  hasMotivationData(): boolean {
    return !!this.ext.primaryGoal ||
           !!this.ext.reminderStyle ||
           !!this.ext.streakSensitivity;
  }

  hasHowLearnData(): boolean {
    return !!this.ext.depthVsBreadth ||
           !!this.ext.explanationStyle ||
           !!this.preferredResourceLocalesInput.trim() ||
           !!this.linkedFormationIdsInput.trim();
  }

  save(form: NgForm): void {
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      this.toastService.error('Please correct the highlighted fields before saving.');
      return;
    }

    const validSkills = this.skills
      .filter(s => s.skillName.trim().length > 0)
      .map(s => ({ skillName: s.skillName.trim(), level: s.level }));

    const body: PortfolioUpsertRequest = {
      currentRole: this.currentRole.trim() || null,
      targetRole: this.targetRole.trim() || null,
      experienceLevel: this.experienceLevel,
      bio: this.bio.trim() || null,
      weeklyStudyHours: this.weeklyStudyHours,
      preferredLanguage: this.preferredLanguage.trim() || null,
      learningStyle: this.learningStyle,
      extendedPreferences: this.buildExtendedForSave(),
      skills: validSkills,
    };

    this.saving = true;
    this.mentorApi.upsertPortfolio(body).subscribe({
      next: () => {
        this.toastService.success('Profile saved successfully');
        this.saving = false;
      },
      error: err => {
        const details = err as { error?: ApiErrorBody; message?: string };
        const message = details.error?.error ?? details.message ?? 'Save failed';
        this.toastService.error(message);
        this.saving = false;
      },
    });
  }
}
