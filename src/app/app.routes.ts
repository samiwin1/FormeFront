import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { HomeComponent } from './features/public/pages/home/home.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';

import { AdminLayoutComponent } from './admin/layout/admin-layout/admin-layout.component';
import { adminGuard } from './admin/admin.guard';

import { ProfileComponent } from './features/auth/pages/profile/profile.component';
import { authGuard } from './core/guards/auth.guard';

import { superAdminGuard } from './core/guards/super-admin.guard';
import { AdminManagementComponent } from './admin/pages/admin-management/admin-management.component';
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
      { path: '', redirectTo: 'formations', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'formations', pathMatch: 'full' },
      { path: 'formations', children: adminFormationRoutes },
    ],
  },

  // ✅ Standalone — no layout wrapper
  {
    path: 'admins',
    component: AdminManagementComponent,
    canActivate: [adminGuard, superAdminGuard],  // keep both guards
  },

  { path: '**', redirectTo: '' },
];