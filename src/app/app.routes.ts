import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/incident-list/incident-list').then((m) => m.IncidentListComponent),
  },

  {
    path: '',
    loadChildren: () => import('./pages/pages.routes').then((m) => m.pagesRoutes),
  },
];
