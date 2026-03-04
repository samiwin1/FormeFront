import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './admin/layout/admin-layout/admin-layout.component';
import { adminGuard } from './admin/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { evaluatorGuard } from './core/guards/evaluator.guard';
import { learnerGuard } from './core/guards/learner.guard';

import { superAdminGuard } from './core/guards/super-admin.guard';
import { AdminManagementComponent } from './admin/pages/admin-management/admin-management.component';


import { UserManagementComponent } from './admin/pages/user-management/user-management.component';
import { formationRoutes, adminFormationRoutes } from './features/formation/formation.routes';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'formations', children: formationRoutes },
    ],
  },

{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivate: [adminGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard',    component: DashboardComponent },
  

    // ✅ NEW: Manage normal users page (inside admin layout)
    { path: 'users', component: UserManagementComponent },
  ],
},
      { path: '', loadComponent: () => import('./features/public/pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent) },
      { path: 'profile', loadComponent: () => import('./features/auth/pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
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
      { path: 'dashboard', redirectTo: 'formations', pathMatch: 'full' },
      { path: 'formations', children: adminFormationRoutes },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
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
    component: AdminManagementComponent,
    canActivate: [adminGuard, superAdminGuard],
    loadComponent: () => import('./admin/pages/admin-management/admin-management.component').then(m => m.AdminManagementComponent),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];
