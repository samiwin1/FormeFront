import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { HomeComponent } from './features/public/pages/home/home.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';

import { AdminLayoutComponent } from './admin/layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './admin/pages/dashboard/dashboard.component';
import { adminGuard } from './admin/admin.guard';

import { ProfileComponent } from './features/auth/pages/profile/profile.component';
import { authGuard } from './core/guards/auth.guard';

import { superAdminGuard } from './core/guards/super-admin.guard';
import { AdminManagementComponent } from './admin/pages/admin-management/admin-management.component';
import { PartnersComponent } from './admin/pages/partners/partners.component';
import { DealsComponent } from './admin/pages/deals/deals.component';
import { PacksComponent } from './admin/pages/packs/packs.component';
import { AccessCodesComponent } from './admin/pages/access-codes/access-codes.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    ],
  },
{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivate: [adminGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard',    component: DashboardComponent },
    { path: 'partners',     component: PartnersComponent },
    { path: 'deals',        component: DealsComponent },
    { path: 'packs',        component: PacksComponent },
    { path: 'access-codes', component: AccessCodesComponent },

    // ✅ NEW: Manage normal users page (inside admin layout)
  ],
},
  // ✅ Standalone — no layout wrapper
  {
    path: 'admins',
    component: AdminManagementComponent,
    canActivate: [adminGuard, superAdminGuard],
  },

  // ✅ Standalone — no layout wrapper


  { path: '**', redirectTo: '' },
];