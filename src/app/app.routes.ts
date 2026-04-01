import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GoalListComponent } from './goal-list/goal-list.component';
import { NotificationsComponent } from './notifications/notifications.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',      component: DashboardComponent },
  { path: 'goals',          component: GoalListComponent },
  { path: 'notifications',  component: NotificationsComponent },
];
