import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Shape of one KPI card shown on the dashboard
export interface EmployeeKPI {
  id: number;
  name: string;
  department: string;
  score: number;       // 0-100
  tasksCompleted: number;
  tasksTotal: number;
  status: 'On Track' | 'At Risk' | 'Behind';
}

// Shape of one goal row in GoalListComponent
// employeeId added so trackBy can use a composite key (employeeId + goalId)
export interface EmployeeGoal {
  id: number;           // goal ID
  employeeId: number;   // employee ID — used in composite trackBy key
  employeeName: string;
  goalTitle: string;
  progress: number;   // 0-100
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

@Injectable({ providedIn: 'root' })
export class KpiService {

  // ── Simulated KPI fetch (replaces a real HTTP call) ──────────────────────
  getKpiData(): Observable<EmployeeKPI[]> {
    const statuses: Array<'On Track' | 'At Risk' | 'Behind'> = ['On Track', 'At Risk', 'Behind'];

    const data: EmployeeKPI[] = [
      { id: 1, name: 'Alice Johnson',  department: 'Engineering', score: this.rand(70, 99), tasksCompleted: this.rand(8, 15),  tasksTotal: 15, status: statuses[0] },
      { id: 2, name: 'Bob Smith',      department: 'Marketing',   score: this.rand(50, 79), tasksCompleted: this.rand(4, 10),  tasksTotal: 12, status: statuses[1] },
      { id: 3, name: 'Carol White',    department: 'Sales',       score: this.rand(30, 59), tasksCompleted: this.rand(2, 7),   tasksTotal: 10, status: statuses[2] },
      { id: 4, name: 'David Brown',    department: 'HR',          score: this.rand(60, 95), tasksCompleted: this.rand(6, 12),  tasksTotal: 13, status: statuses[0] },
      { id: 5, name: 'Eva Martinez',   department: 'Finance',     score: this.rand(45, 85), tasksCompleted: this.rand(5, 11),  tasksTotal: 11, status: statuses[1] },
      { id: 6, name: 'Frank Lee',      department: 'Engineering', score: this.rand(55, 90), tasksCompleted: this.rand(7, 14),  tasksTotal: 14, status: statuses[0] },
    ];

    return of(data).pipe(delay(300));
  }

  // ── Cached goals — returned as-is so Angular finds no binding changes (fixed mode demo) ──
  private cachedGoals: EmployeeGoal[] | null = null;

  // Returns fresh objects every call — Angular (without trackBy) recreates all DOM rows (buggy mode demo)
  getGoals(): Observable<EmployeeGoal[]> {
    return of(this.generateGoals());
  }

  // Returns the same cached objects every call — Angular (with trackBy) finds nothing to update (fixed mode demo)
  getGoalsCached(): Observable<EmployeeGoal[]> {
    if (!this.cachedGoals) {
      this.cachedGoals = this.generateGoals();
    }
    return of(this.cachedGoals);
  }

  private generateGoals(): EmployeeGoal[] {
    const titles = [
      'Complete Q2 Sales Target', 'Finish Security Training', 'Submit Performance Review',
      'Launch Marketing Campaign', 'Reduce Support Tickets', 'Improve Team Velocity',
      'Complete AWS Certification', 'Conduct 1-on-1 Meetings', 'Update Project Docs',
      'Deploy New Feature', 'Hire 2 Engineers', 'Onboard New Clients',
    ];
    const names = [
      'Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry',
      'Iris', 'Jake', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul',
      'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xander',
    ];
    const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

    const goals: EmployeeGoal[] = [];

    for (let i = 1; i <= 2000; i++) {
      const empIndex = i % names.length;
      goals.push({
        id:           i,
        employeeId:   empIndex + 1,
        employeeName: names[empIndex] + ' ' + String.fromCharCode(65 + (i % 26)),
        goalTitle:    titles[i % titles.length],
        progress:     Math.floor(Math.random() * 100),
        dueDate:      this.randomDate(),
        priority:     priorities[i % 3],
      });
    }

    return goals;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomDate(): string {
    const start = new Date(2025, 0, 1);
    const end   = new Date(2025, 11, 31);
    const d     = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return d.toISOString().split('T')[0];
  }
}
