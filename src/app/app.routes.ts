import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './admin/layout/admin-layout/admin-layout.component';
import { adminGuard } from './admin/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { evaluatorGuard } from './core/guards/evaluator.guard';
import { learnerGuard } from './core/guards/learner.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { UserManagementComponent } from './admin/pages/user-management/user-management.component';
import { formationRoutes, adminFormationRoutes } from './features/formation/formation.routes';
import { adminEventsRoutes } from './features/events/events.routes';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent) },
      { path: 'profile', loadComponent: () => import('./features/auth/pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/events/pages/event-list/event-list.component').then(m => m.EventListComponent),
      },
      {
        path: 'events/:id/workspace',
        loadComponent: () =>
          import('./features/events/pages/event-workspace/event-workspace.component').then(m => m.EventWorkspaceComponent),
        canActivate: [authGuard],
      },
      {
        path: 'events/:id/participate',
        loadComponent: () =>
          import('./features/events/pages/event-participate/event-participate.component').then(m => m.EventParticipateComponent),
        canActivate: [authGuard],
      },
      {
        path: 'events/:id/sponsor-insights',
        loadComponent: () =>
          import('./features/events/pages/event-sponsor-insights/event-sponsor-insights.component').then(
            (m) => m.EventSponsorInsightsComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./features/events/pages/event-detail/event-detail.component').then(m => m.EventDetailComponent),
      },
      { path: 'formations', children: formationRoutes },
      { path: 'me/certification-list', redirectTo: 'me/certification-space', pathMatch: 'full' },
      {
        path: 'evaluator/oral-assignments',
        loadComponent: () => import('./features/certification/evaluator/certification-evaluator.component').then(m => m.CertificationEvaluatorComponent),
        canActivate: [evaluatorGuard],
      },
      {
        path: 'me/certification-space',
        loadComponent: () => import('./features/certification/learner/certification-learner.component').then(m => m.CertificationLearnerComponent),
        canActivate: [learnerGuard],
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'formations', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'users', component: UserManagementComponent },
      { path: 'formations', children: adminFormationRoutes },
      { path: 'events', children: adminEventsRoutes },
      { path: 'certifications', loadComponent: () => import('./features/certification/admin/certification-admin.component').then(m => m.CertificationAdminComponent), data: { mode: 'certification' } },
      { path: 'oral-sessions', loadComponent: () => import('./features/certification/admin/certification-admin.component').then(m => m.CertificationAdminComponent), data: { mode: 'oral' } },
      { path: 'oral-sessions/calendar', loadComponent: () => import('./admin/pages/sessions-calendar/sessions-calendar.component').then(m => m.SessionsCalendarComponent) },
      { path: 'reschedule', loadComponent: () => import('./admin/pages/reschedule-admin/reschedule-admin.component').then(m => m.RescheduleAdminComponent) },
      { path: 'issued-certificates', loadComponent: () => import('./admin/pages/issued-certificates-admin/issued-certificates-admin.component').then(m => m.IssuedCertificatesAdminComponent) },
      { path: 'sessions-calendar', loadComponent: () => import('./admin/pages/sessions-calendar/sessions-calendar.component').then(m => m.SessionsCalendarComponent) },
    ],
  },
  {
    path: 'admins',
    loadComponent: () => import('./admin/pages/admin-management/admin-management.component').then(m => m.AdminManagementComponent),
    canActivate: [adminGuard, superAdminGuard],
  },
  { path: '**', redirectTo: '' },
];
