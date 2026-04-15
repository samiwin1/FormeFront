export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type LearningStyle = 'VISUAL' | 'READING' | 'HANDS_ON' | 'VIDEO';
export type SelfAssessedSkillLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type MentorChannel = 'ASK' | 'WEEKLY_BRIEF' | 'PRE_EXAM' | 'LEARNING_PATH' | 'REMEDIATION';

export interface SkillUpsertDto {
  skillName: string;
  level: SelfAssessedSkillLevel;
}

export type ExamFormatPreference = 'PROCTORED' | 'TAKE_HOME' | 'PRACTICAL' | 'ANY';
export type ExamAttemptContext = 'FIRST_ATTEMPT' | 'RETAKE';
export type StudyModeForExams = 'CRAM' | 'LONG_PREP';
export type MockExamFrequency = 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type StudyWindow = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
export type DevicePrimary = 'MOBILE' | 'DESKTOP' | 'MIXED';
export type PrimaryGoal = 'JOB_CHANGE' | 'PROMOTION' | 'EXAM_PASS' | 'CURIOSITY' | 'OTHER';
export type ReminderStyle = 'NONE' | 'LIGHT' | 'STRICT';
export type StreakSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';
export type DepthVsBreadth = 'DEPTH' | 'BREADTH' | 'BALANCED';
export type ExplanationStyle = 'ANALOGY' | 'STEPS' | 'MATH_HEAVY' | 'LABS';

export interface TargetCertificationDto {
  name: string;
  provider?: string | null;
  targetExamDate?: string | null;
}

export interface HeldCertificationDto {
  name: string;
  year?: number | null;
}

export interface MentorExtendedPreferences {
  targetCertifications?: TargetCertificationDto[];
  heldCertifications?: HeldCertificationDto[];
  examFormatPreference?: ExamFormatPreference | null;
  examAttemptContext?: ExamAttemptContext | null;
  studyModeForExams?: StudyModeForExams | null;
  mockExamFrequency?: MockExamFrequency | null;
  timezone?: string | null;
  studyWindows?: StudyWindow[];
  devicePrimary?: DevicePrimary | null;
  accessibilityNotes?: string | null;
  maxSessionMinutes?: number | null;
  primaryGoal?: PrimaryGoal | null;
  reminderStyle?: ReminderStyle | null;
  streakSensitivity?: StreakSensitivity | null;
  depthVsBreadth?: DepthVsBreadth | null;
  explanationStyle?: ExplanationStyle | null;
  resourceLanguageTolerance?: string | null;
  preferredResourceLocales?: string[];
  linkedFormationIds?: number[];
}

export function emptyMentorExtendedPreferences(): MentorExtendedPreferences {
  return {
    targetCertifications: [],
    heldCertifications: [],
    studyWindows: [],
    preferredResourceLocales: [],
    linkedFormationIds: [],
  };
}

export interface PortfolioUpsertRequest {
  currentRole?: string | null;
  targetRole?: string | null;
  experienceLevel: ExperienceLevel;
  bio?: string | null;
  weeklyStudyHours?: number | null;
  preferredLanguage?: string | null;
  learningStyle: LearningStyle;
  extendedPreferences?: MentorExtendedPreferences | null;
  skills?: SkillUpsertDto[] | null;
}

export interface SkillResponseDto {
  skillName: string;
  level: SelfAssessedSkillLevel;
}

export interface PortfolioExistsResponse {
  exists: boolean;
}

export interface PortfolioResponseDto {
  id: number;
  userId: number;
  currentRole?: string | null;
  targetRole?: string | null;
  experienceLevel: ExperienceLevel;
  bio?: string | null;
  weeklyStudyHours?: number | null;
  preferredLanguage?: string | null;
  learningStyle: LearningStyle;
  extendedPreferences?: MentorExtendedPreferences | null;
  skills: SkillResponseDto[];
  createdAt: string;
  updatedAt: string;
}

/** Prior turns only; current question is sent separately as `question`. */
export interface MentorChatTurn {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface MentorAskRequest {
  question: string;
  formationId?: number | null;
  locale?: string | null;
  conversationHistory?: MentorChatTurn[];
  threadId?: number | null;
}

export type MentorResponseType = 'FORMATION_RECOMMENDATION' | 'FORMATION_MISSING' | 'GENERAL_ADVICE';

/** Parsed from mentor `structuredJson` (ask channel). */
export interface MentorAdviceStructured {
  type?: MentorResponseType;
  summary?: string;
  bullets?: string[];
  weakTopics?: string[];
  suggestedActions?: string[];
  recommendedFormationIds?: number[];
  recommendedCertificationIds?: number[];
  recommendationNotes?: string;
  detectedTargetRole?: string | null;
  detectedSkillsGap?: string | null;
  studyPlan?: {
    title?: string;
    items?: Array<{
      type?: string;
      title?: string;
      durationMinutes?: number;
      resourceRef?: string;
    }>;
  };
  // Learning-path channel fields
  totalEstimatedWeeks?: number;
  formations?: LearningPathFormation[];
  certificationReadiness?: CertificationReadiness[];
  skillGaps?: SkillGap[];
  nextAction?: string;
}

// ── Formation Demand (admin) ──────────────────────────────────────────────

export interface FormationDemandDto {
  id: number;
  userId: number;
  requestedRole: string;
  detectedSkillsGap: string | null;
  createdAt: string;
  fulfilled?: boolean;
}

export interface RoleDemandCountDto {
  requestedRole: string;
  count: number;
}

export interface FormationDemandAggregateDto {
  requestedRole: string;
  totalRequests: number;
  recentDemands: FormationDemandDto[];
}

export interface LearningPathFormation {
  formationId: number;
  title: string;
  priority: number;
  reason: string;
  estimatedWeeks: number;
  prerequisiteMet: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface CertificationReadiness {
  certificationName: string;
  targetDate: string;
  onTrack: boolean;
  remainingFormations: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface SkillGap {
  skillName: string;
  currentLevel: string;
  targetLevel: string;
  suggestion: string;
}

export interface MentorAdviceResponseDto {
  sessionId: number;
  summary?: string | null;
  structuredJson?: string | null;
  rawText?: string | null;
  threadId?: number | null;
}

// ── Feedback ──────────────────────────────────────────────────────────────

export type FeedbackRating = 'UP' | 'DOWN';

export interface FeedbackResponseDto {
  id: number;
  sessionId: number;
  rating: FeedbackRating;
  comment?: string | null;
  createdAt: string;
}

// ── Conversation threads ──────────────────────────────────────────────────

export interface ThreadSummaryDto {
  id: number;
  title: string;
  formationId?: number | null;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export interface ThreadMessageDto {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sessionId?: number | null;   // for assistant messages — pass to feedback component
  createdAt: string;
}

export interface ThreadDetailDto {
  id: number;
  title: string;
  formationId?: number | null;
  messages: ThreadMessageDto[];
}

// ── Adaptive difficulty ────────────────────────────────────────────────────

export interface DifficultyAlert {
  alertType: 'REPEATED_FAILURE' | 'DECLINING_SCORES' | 'LOW_PASS_SCORE' | 'STALLED_PROGRESS';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  formationId: number;
  formationTitle: string;
  description: string;
  failedAttempts: number;
  lastScore?: number | null;
  lastAttemptDate?: string | null;
}

export interface MentorHistoryItemDto {
  sessionId: number;
  channel: MentorChannel;
  formationId?: number | null;
  createdAt: string;
  summary?: string | null;
  structuredJsonPreview?: string | null;
  bookmarked?: boolean;
}

/** Spring Data Page JSON */
export interface PageMentorHistory {
  content: MentorHistoryItemDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Bookmarks ─────────────────────────────────────────────────────────────

export interface BookmarkedAdviceDto {
  bookmarkId: number;
  sessionId: number;
  channel: MentorChannel;
  formationId?: number | null;
  sessionCreatedAt: string;
  bookmarkedAt: string;
  note?: string | null;
  summary?: string | null;
  structuredJsonPreview?: string | null;
}

export interface PageBookmarks {
  content: BookmarkedAdviceDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface BookmarkToggleResponse {
  bookmarked: boolean;
  sessionId: number;
}

// ── Study plans ────────────────────────────────────────────────────────────

export interface StudyPlanItemResponseDto {
  id: number;
  sortOrder?: number | null;
  itemType?: string | null;
  title: string;
  durationMinutes?: number | null;
  resourceRef?: string | null;
  completed: boolean;
  completedAt?: string | null;
}

export interface ItemCompleteResponseDto {
  message: string;
  currentStreak: number;
  planComplete?: boolean;
}

export interface StudyPlanResponseDto {
  id: number;
  title: string;
  createdAt: string;
  validUntil?: string | null;
  sourceChannel?: string | null;
  items: StudyPlanItemResponseDto[];
}

export interface ApiErrorBody {
  error?: string;
}

// ── Streak ────────────────────────────────────────────────────────────────

export interface StreakResponseDto {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate?: string | null;
  activeToday: boolean;
}
