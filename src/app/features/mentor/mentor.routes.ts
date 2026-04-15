import { Routes } from '@angular/router';
import { learnerGuard } from '../../core/guards/learner.guard';

export const mentorRoutes: Routes = [
  {
    path: '',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-hub/mentor-hub.component').then(m => m.MentorHubComponent),
  },
  {
    path: 'portfolio',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/portfolio-edit/portfolio-edit.component').then(m => m.PortfolioEditComponent),
  },
  {
    path: 'ask',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-ask/mentor-ask.component').then(m => m.MentorAskComponent),
  },
  {
    path: 'pre-exam/:formationId',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-pre-exam/mentor-pre-exam.component').then(m => m.MentorPreExamComponent),
  },
  {
    path: 'history',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-history/mentor-history.component').then(m => m.MentorHistoryComponent),
  },
  {
    path: 'learning-path',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-learning-path/mentor-learning-path.component').then(
        m => m.MentorLearningPathComponent
      ),
  },
  {
    path: 'remediation/:formationId',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-remediation/mentor-remediation.component').then(
        m => m.MentorRemediationComponent
      ),
  },
  {
    path: 'study-plans',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-study-plans/mentor-study-plans.component').then(
        m => m.MentorStudyPlansComponent
      ),
  },
  {
    path: 'bookmarks',
    canActivate: [learnerGuard],
    loadComponent: () =>
      import('./pages/mentor-bookmarks/mentor-bookmarks.component').then(
        m => m.MentorBookmarksComponent
      ),
  },
];
