import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AppNotification {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'error';
  time: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  
  private subject = new Subject<AppNotification>();

  notifications$ = this.subject.asObservable();

  activeSubscriptions = 0;

  private idCounter = 0;

  send(message: string, type: AppNotification['type'] = 'info'): void {
    this.subject.next({
      id: ++this.idCounter,
      message,
      type,
      time: new Date().toLocaleTimeString(),
    });
  }
}
