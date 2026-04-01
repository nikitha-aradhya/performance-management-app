import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeKPI } from '../services/kpi.service';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent implements OnChanges {

  @Input() kpi!: EmployeeKPI;
  @Input() isBuggy = false; 
  private cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['kpi']) {
      this.cdr.markForCheck();
    }
  }

  getStatusBadge(status: string): string {
    if (status === 'On Track') return 'bg-success';
    if (status === 'At Risk')  return 'bg-warning text-dark';
    return 'bg-danger';
  }

  getProgressBar(score: number): string {
    if (score >= 70) return 'bg-success';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
  }
}
