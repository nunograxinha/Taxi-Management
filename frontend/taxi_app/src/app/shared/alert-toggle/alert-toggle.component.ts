import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AlertNotificationService } from '../../appServices/alert-notification.service';

@Component({
  selector: 'app-alert-toggle',
  templateUrl: './alert-toggle.component.html',
  styleUrls: ['./alert-toggle.component.css']
})
export class AlertToggleComponent implements OnInit, OnDestroy {
  isMuted = false;
  private sub = new Subscription();

  constructor(
    private alertService: AlertNotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isMuted = this.alertService.isMuted;
    this.sub.add(
      this.alertService.muted$.subscribe((muted) => {
        this.isMuted = muted;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get supportsDesktopNotifications(): boolean {
    return this.alertService.isBrowserNotificationSupported;
  }

  get desktopPermission(): NotificationPermission | 'unsupported' {
    return this.alertService.notificationPermission;
  }

  get desktopButtonTitle(): string {
    if (this.desktopPermission === 'granted') {
      return 'Desktop alerts active for background tabs';
    }
    if (this.desktopPermission === 'denied') {
      return 'Desktop notifications blocked in browser settings';
    }
    return 'Enable desktop alerts when tab is in the background';
  }

  onToggleMute(): void {
    this.alertService.toggleMute();
  }

  async onToggleDesktopAlerts(): Promise<void> {
    const current = this.desktopPermission;
    if (current === 'granted') {
      this.snackBar.open('Desktop alerts are active when this tab is in the background.', 'Close', {
        duration: 3000
      });
      return;
    }
    if (current === 'denied') {
      this.snackBar.open('Browser notifications are blocked. Enable them in your browser site settings.', 'Close', {
        duration: 4000
      });
      return;
    }

    const result = await this.alertService.requestBrowserNotificationPermission();
    if (result === 'granted') {
      this.snackBar.open('Desktop alerts enabled for background tabs.', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Desktop alerts were not enabled.', 'Close', { duration: 3000 });
    }
  }
}
