import { Routes } from '@angular/router';
import { AdminEventParticipantsComponent } from './pages/admin/admin-event-participants/admin-event-participants.component';

/** Public `/events` routes are declared in `app.routes.ts` (flat paths) so the hub never resolves to another feature. */

export const adminEventsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin/admin-event-list/admin-event-list.component').then(
        m => m.AdminEventListComponent
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/admin/admin-event-create/admin-event-create.component').then(
        m => m.AdminEventCreateComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/admin/admin-event-edit/admin-event-edit.component').then(
        m => m.AdminEventEditComponent
      ),
  },
  {
    path: ':id/participants',
    component: AdminEventParticipantsComponent,
  },
];
