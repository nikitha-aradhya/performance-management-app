import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { NotificationService, AppNotification } from '../services/notification.service';

const USE_BUGGY_CODE = true;  // <── CHANGE ME

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {

  received: AppNotification[] = [];
  isBuggy = USE_BUGGY_CODE;

  notificationService = inject(NotificationService); 
  private destroyRef   = inject(DestroyRef);

  ngOnInit(): void {
    if (USE_BUGGY_CODE) {
      this.startBuggySubscription();
    } else {
      this.startFixedSubscription();
    }
  }

  private startBuggySubscription(): void {
    this.notificationService.activeSubscriptions++;   

    this.notificationService.notifications$
      .subscribe(msg => {                          
        this.received.unshift(msg);
      });
  }
  private startFixedSubscription(): void {
    this.notificationService.activeSubscriptions++;   
    this.notificationService.notifications$
      .pipe(
        takeUntilDestroyed(this.destroyRef),          
        finalize(() => {
          this.notificationService.activeSubscriptions--;
        })
      )
      .subscribe(msg => {
        this.received.unshift(msg);
      });
  }

  sendTestNotification(): void {
    const types: AppNotification['type'][] = ['info', 'warning', 'error'];
    const messages = [
      'Alice completed her Q2 goal!',
      'Bob is at risk — 2 goals overdue.',
      'System alert: performance score dropped.',
      'New goal assigned to Engineering team.',
    ];
    const randomMsg  = messages[Math.floor(Math.random() * messages.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    this.notificationService.send(randomMsg, randomType);
  }

  getBadge(type: string): string {
    if (type === 'error')   return 'bg-danger';
    if (type === 'warning') return 'bg-warning text-dark';
    return 'bg-info text-dark';
  }
}
