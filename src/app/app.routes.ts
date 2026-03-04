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

import { ProductCreateComponent } from './admin/pages/products/product-create/product-create.component';
import { ProductListComponent } from './admin/pages/products/product-list/product-list.component';
import { OrderListComponent } from './admin/pages/orders/order-list/order-list.component';
import { CoursesComponent } from './features/public/pages/courses/courses.component';
import { CartComponent } from './features/public/pages/cart/cart.component';
import { CheckoutComponent } from './features/public/pages/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/public/pages/order-confirmation/order-confirmation.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'courses', component: CoursesComponent },
      { path: 'cart', component: CartComponent, canActivate: [authGuard] },
      { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
      { path: 'order/confirmation/:orderId', component: OrderConfirmationComponent, canActivate: [authGuard] },
    ],
  },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products/create', component: ProductCreateComponent },
      { path: 'products/edit/:id', component: ProductCreateComponent },
      { path: 'products/list', component: ProductListComponent },
      { path: 'orders', component: OrderListComponent },
    ],
  },

  {
    path: 'admins',
    component: AdminManagementComponent,
    canActivate: [adminGuard, superAdminGuard],
  },

  { path: '**', redirectTo: '' },
];