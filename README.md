# FormeFront

## Project Overview

FormeFront is the Angular 19 frontend for the Forme learning platform. It delivers a full learner and admin experience with:

- AI-powered mentor features
- learner profile and portfolio management
- formation browsing, exams, and evaluation workflows
- certification progress and issue tracking
- admin dashboards, user management, and scheduling
- shared UI components and dynamic theme loading

This app uses Angular standalone components, lazy-loaded route-based pages, and a service-driven architecture to keep feature responsibilities separated.

## Application Structure

### Main app shell
- `src/app/app.component.ts`
  - application root component
  - initializes global keyboard shortcuts
  - renders toast notifications
- `src/app/app.routes.ts`
  - defines public, learner/mentor, certification, evaluator, and admin routes
  - connects feature route children and guards
- `src/app/shared/layouts/public-layout/public-layout.component.ts`
  - public-facing wrapper with header + footer
  - hides footer for specific protected screens
- `src/app/admin/layout/admin-layout/admin-layout.component.ts`
  - admin wrapper with sidebar, header, footer
  - loads admin theme CSS/JS assets dynamically from `assets/duralux`

### Environment configuration
- `src/enviroments/environment.ts`
  - `apiUrl` for user and mentor backend
  - `formationApiUrl` for formation backend
  - `certificationApiUrl` for certification backend
  - `gatewayApiUrl` for gateway access

## Route Map

### Public routes
- `/` → Home page
- `/login` → Login page
- `/register` → Registration page
- `/profile` → Profile page (`authGuard`)
- `/formations` → Formation catalog and details

### Learner / mentor routes
- `/me/mentor` → Mentor hub (`learnerGuard`)
- `/me/mentor/portfolio` → Portfolio editor
- `/me/mentor/ask` → Mentor chat
- `/me/mentor/weekly-brief` → Weekly brief
- `/me/mentor/pre-exam/:formationId` → Pre-exam help
- `/me/mentor/history` → Mentor advice history
- `/me/mentor/learning-path` → Learning path suggestions

### Formation routes
- `/formations` → Formation list
- `/formations/:id` → Formation detail
- `/formations/:id/history` → Formation history (`authGuard`)
- `/formations/:id/exam` → Exam page (`authGuard`, `examEligibilityGuard`)
- `/formations/:id/result` → Exam result page (`authGuard`)

### Admin routes
- `/admin/dashboard` → Admin dashboard
- `/admin/formations` → Admin formation management
- `/admin/formations/create` → Create formation
- `/admin/formations/:id/edit` → Edit formation
- `/admin/formations/:id/content` → Formation content management
- `/admin/formations/:id/evaluations` → Admin evaluation workflow
- `/admin/formations/:id/exam` → Admin exam management
- `/admin/users` → User management
- `/admin/certifications` → Certifications dashboard
- `/admin/oral-sessions` → Oral session management
- `/admin/reschedule` → Reschedule management
- `/admin/issued-certificates` → Issued certificates list
- `/admin/sessions-calendar` → Sessions calendar

### Super-admin routes
- `/admins` → Advanced management page

## Core Services and Responsibilities

### Authentication and security
- `AuthService` (`src/app/core/services/auth.service.ts`)
  - login, register, logout
  - JWT storage and token decoding
  - role checks for admin, super-admin, learner, evaluator
- `authInterceptor` (`src/app/core/interceptors/auth.interceptor.ts`)
  - attaches `Authorization: Bearer <token>` to outgoing requests

### UI helpers
- `ToastService` — toast notifications
- `ThemeLoaderService` — dynamic theme CSS/JS loading
- `KeyboardShortcutsService` — global keyboard shortcuts
- `AssetLoaderService` — runtime asset loading

### User / admin core services
- `AdminApi` — admin backend operations
- `DashboardService` — admin dashboard data
- `UserDirectoryService` — user directory and profile lookup
- `NotificationService` — in-app notifications
- `LinkedInPostService` — LinkedIn-related actions

### Formation and assessment services
- `FormationService` (`src/app/features/formation/services/formation.service.ts`)
  - fetch formations, filter/search, progress, content, CRUD
  - reset user progress and generate AI-supported formation content
- `ExamService` (`src/app/features/formation/services/exam.service.ts`)
  - exam retrieval, start, save answers, submit, remaining time
  - user exam history and result retrieval
- `EvaluationService` (`src/app/features/formation/services/evaluation.service.ts`)
  - evaluation creation, submission, results, and history
- `StatisticsService` — formation analytics and reporting
- `AgentThinkingService` — UI state for AI processing and loading animations

### Certification and learner services
- `CertificationService` (`src/app/core/services/certification.service.ts`)
  - certification listing, creation, update, publish, archive
- `IssuedCertificationService` — issued certificate operations
- `CertificateEventsService` — certification event history
- `OralSessionService` — oral session workflows
- `FeedbackService` — feedback submission and tracking
- `AssignmentService` — assignment-related workflow

### Mentor feature service
- `MentorApiService` (`src/app/features/mentor/services/mentor-api.service.ts`)
  - learner portfolio checks and updates
  - mentor chat and advice requests
  - weekly briefs and pre-exam tip retrieval
  - learning path generation and advice history
  - thread and conversation management
  - feedback submission, difficulty alerts, remediation

## Feature Relationships

### Mentor experience
Mentor pages are protected by `learnerGuard` and rely on `MentorApiService` for all backend interactions. `AuthService` provides user identity and role context.

### Formation and exam flow
Formation pages use `FormationService` for course data and progress, `ExamService` for exam execution, and `EvaluationService` for evaluation submission. `authGuard` and `examEligibilityGuard` restrict access based on login and exam readiness.

### Certification and evaluator workflows
Certification and oral evaluator pages use `CertificationService`, `IssuedCertificationService`, `CertificateEventsService`, and `OralSessionService`. Evaluator-specific pages are gated by `evaluatorGuard`.

### Admin console
The admin UI runs under `AdminLayoutComponent` and loads Duralux theme resources. It uses admin-specific services like `DashboardService`, `AdminApi`, `UserDirectoryService`, and `CertificationService`.

### Shared UI components
- `HeaderComponent`
- `FooterComponent`
- `ToastComponent`
- `NotificationBellComponent`
- `PdfViewerComponent`
- `SkeletonLoaderComponent`

These components are reused in the public shell and admin shell.

## Development Setup

### Install dependencies

```bash
npm install
```

### Run development server

```bash
ng serve
```

Open `http://localhost:4200/` in your browser.

### Build

```bash
ng build
```

Build artifacts are output to `dist/forme-frontend`.

### Unit tests

```bash
ng test
```

## Helpful Routes

- `/` — public home
- `/login` — login page
- `/register` — registration page
- `/profile` — profile page
- `/formations` — formation catalog
- `/me/mentor` — mentor hub
- `/me/mentor/ask` — mentor chat
- `/me/mentor/weekly-brief` — weekly AI brief
- `/me/mentor/learning-path` — learning path suggestions
- `/me/mentor/pre-exam/:formationId` — pre-exam tips
- `/me/certification-space` — learner certification space
- `/admin/dashboard` — admin dashboard
- `/admin/formations` — admin formation management
- `/admin/users` — user management
- `/admin/certifications` — certification management
- `/admin/issued-certificates` — issued certificates

## Notes

- Uses Angular 19 standalone components.
- Uses separate backend URLs for user/mentor, formation, and certification APIs.
- Uses route guards to enforce learner, evaluator, admin, and super-admin access.
- Mentor functionality is centralized in `MentorApiService`.
- Formation and exam functionality is centralized in `FormationService`, `ExamService`, and `EvaluationService`.
- Admin UI dynamically loads theme assets using `ThemeLoaderService`.

## File locations worth reviewing

- `src/app/app.routes.ts`
- `src/app/shared/layouts/public-layout/public-layout.component.ts`
- `src/app/admin/layout/admin-layout/admin-layout.component.ts`
- `src/app/core/services/auth.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/features/mentor/services/mentor-api.service.ts`
- `src/app/features/formation/services/formation.service.ts`
- `src/app/features/formation/services/exam.service.ts`
- `src/app/features/formation/services/evaluation.service.ts`
- `src/enviroments/environment.ts`
