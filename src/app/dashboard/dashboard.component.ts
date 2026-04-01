import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KpiService, EmployeeKPI } from '../services/kpi.service';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
// BUG 1 — Memory Leak toggle
// true  → interval keeps running (no cleanup)
// false → auto cleanup with takeUntilDestroyed()
const USE_BUGGY_POLLING = true; // change this
// BUG 3 — OnPush issue toggle
// true  → mutating same objects → UI won’t update
// false → creating new objects → UI updates fine
const USE_BUGGY_ONPUSH = true;  // change here to bug and solutionnn fixes

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {

  kpiData: EmployeeKPI[] = [];
  pollCount   = 0;
  isBuggyPolling  = USE_BUGGY_POLLING;
  isBuggyOnPush   = USE_BUGGY_ONPUSH;
  lastUpdated = '';

  private kpiService = inject(KpiService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (USE_BUGGY_POLLING) {
      this.startBuggyPolling();
    } else {
      this.startFixedPolling();
    }
  }

  // BUG 1 — Memory Leak (unsubscribed interval)
  // interval() ticks forever. We never call unsubscribe(). Every navigation
  // away-and-back creates another live subscription. After 10 navigations you
  private startBuggyPolling(): void {
    interval(5000)
      .pipe(switchMap(() => this.kpiService.getKpiData()))
      .subscribe(data => {                 
        this.applyUpdate(data);
      });
  }

  // fix 1 — takeUntilDestroyed()
  // DestroyRef.onDestroy() fires when Angular destroys the component.
  // takeUntilDestroyed() wires into that event and completes the observable,
  private startFixedPolling(): void {
    interval(5000)
      .pipe(
        switchMap(() => this.kpiService.getKpiData()),
        takeUntilDestroyed(this.destroyRef)   // ← FIX: auto-unsubscribes on destroy
      )
      .subscribe(data => {
        this.applyUpdate(data);
      });
  }

// Bug 3 — OnPush issue (USE_BUGGY_ONPUSH)
// We update the same objects instead of creating new ones,
// so the @Input reference doesn’t change.
// OnPush skips the update → UI looks stuck.
//
// Fix:
// Create new objects (spread) so the reference changes.
// Note: use structuredClone if it’s deeply nested.
  private applyUpdate(data: EmployeeKPI[]): void {
    if (USE_BUGGY_ONPUSH) {
      if (this.kpiData.length === 0) {
        this.kpiData = data;
      } else {
        // kpiData[i] is the SAME object reference that KpiCardComponent already
        // holds as @Input. OnPush compares old ref === new ref → true → skips
        // the check → the card view is never updated.
        data.forEach((newEmp, i) => {
          this.kpiData[i].score          = newEmp.score;
          this.kpiData[i].tasksCompleted = newEmp.tasksCompleted;
          this.kpiData[i].status         = newEmp.status;
        });
      }
    } else {
      this.kpiData = data.map(emp => ({ ...emp }));
    }

    this.pollCount++;
    this.lastUpdated = new Date().toLocaleTimeString();
  }

  // trackBy keeps Angular from tearing down and rebuilding card instances on
  // every poll.  Stable DOM nodes are what makes the OnPush mutation bug
  // observable: without trackBy, *ngFor would recreate every component from
  // scratch on each poll (passing the new object directly), which would
  // accidentally "fix" the bug by side-stepping the reference-equality check.
  trackById(_index: number, emp: EmployeeKPI): number {
    return emp.id;
  }

  getStatusBadge(status: string): string {
    if (status === 'On Track') return 'bg-success';
    if (status === 'At Risk')  return 'bg-warning text-dark';
    return 'bg-danger';
  }
}
