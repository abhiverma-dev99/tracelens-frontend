import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/incident-list/incident-list').then((m) => m.IncidentListComponent),
  },

  {
    path: '',
    loadChildren: () => import('./pages/pages.routes').then((m) => m.pagesRoutes),
  },
];
