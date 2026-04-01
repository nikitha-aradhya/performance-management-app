import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiService, EmployeeGoal } from '../services/kpi.service';

const USE_BUGGY_CODE = false;  // changehere

@Component({
  selector: 'app-goal-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './goal-list.component.html',
  styleUrl: './goal-list.component.scss',
})
export class GoalListComponent implements OnInit {

  goals: EmployeeGoal[] = [];
  isBuggy  = USE_BUGGY_CODE;
  renderMs = 0;

  private kpiService = inject(KpiService);

  ngOnInit(): void {
    this.loadGoals();
  }
  reloadGoals(): void {
    const start = performance.now();
    const source = this.isBuggy
      ? this.kpiService.getGoals()
      : this.kpiService.getGoalsCached();

    source.subscribe(data => {
      this.goals = data;
      setTimeout(() => {
        this.renderMs = Math.round(performance.now() - start);
      }, 0);
    });
  }

  private loadGoals(): void {
    const source = this.isBuggy
      ? this.kpiService.getGoals()
      : this.kpiService.getGoalsCached();

    source.subscribe(data => {
      const start = performance.now();
      this.goals  = data;
      setTimeout(() => {
        this.renderMs = Math.round(performance.now() - start);
      }, 0);
    });
  }

  //
  // WHY composite key instead of just goal.id?
  //   An employee can appear in multiple goals. If we only used goal.id,
  //   two goals from different employees could theoretically share an ID if
  //   the backend paginates or resets IDs per employee. The composite key
  //   `${employeeId}-${goalId}` is globally unique — it uniquely identifies
  //   exactly ONE row regardless of how data is fetched or sorted.
  //
  // BUGGY behaviour (USE_BUGGY_CODE = true):
  //   No trackBy — Angular destroys and recreates ALL 210 <tr> elements on
  //   every change-detection cycle. Causes jank and high CPU on large lists.
  //
  // FIXED behaviour (USE_BUGGY_CODE = false):
  //   Angular calls trackByCompositeKey() for each item and compares the
  //   returned string. If the key is the same as last cycle, the DOM node is
  //   REUSED — no destroy/recreate. Only truly new or removed rows are touched.
  //
  // Unit test (goal-list.component.spec.ts) proves:
  //   Two different object references with the same employeeId+id return the
  //   same composite key → Angular would reuse the DOM node, not re-render it.
  //
  trackByCompositeKey(_index: number, goal: EmployeeGoal): string {
    return `${goal.employeeId}-${goal.id}`;
  }

  getPriorityBadge(priority: string): string {
    if (priority === 'High')   return 'bg-danger';
    if (priority === 'Medium') return 'bg-warning text-dark';
    return 'bg-secondary';
  }

  getProgressColour(progress: number): string {
    if (progress >= 70) return 'bg-success';
    if (progress >= 40) return 'bg-warning';
    return 'bg-danger';
  }
}
