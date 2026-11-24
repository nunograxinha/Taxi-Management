import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AlertSoundType =
  | 'new-request'
  | 'accepted'
  | 'trip-update'
  | 'chat'
  | 'warning'
  | 'toggle-on';

export interface AlertNotifyOptions {
  title: string;
  body: string;
  sound?: AlertSoundType;
  tag?: string;
  requireHiddenTab?: boolean;
}

interface ToneStep {
  freq: number;
  delaySec: number;
  durationSec: number;
  gain: number;
  wave: OscillatorType;
}

@Injectable({
  providedIn: 'root'
})
export class AlertNotificationService {
  private readonly STORAGE_KEY = 'taxi_app_alerts_muted';
  private readonly SOUND_COOLDOWN_MS = 800;

  private mutedSubject = new BehaviorSubject<boolean>(this.readInitialMutedState());
  readonly muted$ = this.mutedSubject.asObservable();

  private audioCtx: AudioContext | null = null;
  private lastSoundAt = new Map<AlertSoundType, number>();
  private unlockBound = false;

  constructor() {
    this.bindAudioUnlock();
  }

  get isMuted(): boolean {
    return this.mutedSubject.value;
  }

  get isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  get notificationPermission(): NotificationPermission | 'unsupported' {
    return this.isBrowserNotificationSupported ? Notification.permission : 'unsupported';
  }

  setMuted(muted: boolean): void {
    this.mutedSubject.next(muted);
    try {
      localStorage.setItem(this.STORAGE_KEY, muted ? 'true' : 'false');
    } catch {
      // Ignore storage quota or private-browsing errors
    }

    if (!muted) {
      this.unlockAudio();
      this.playSound('toggle-on', true);
    }
  }

  toggleMute(): boolean {
    const nextMuted = !this.isMuted;
    this.setMuted(nextMuted);
    return nextMuted;
  }

  async requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isBrowserNotificationSupported) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  unlockAudio(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (!this.audioCtx) {
        const AudioCtxCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxCtor) {
          return;
        }
        this.audioCtx = new AudioCtxCtor();
      }
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume().catch(() => {});
      }
    } catch {
      // Web Audio API unavailable
    }
  }

  playSound(type: AlertSoundType, bypassCooldown = false): void {
    if (this.isMuted) {
      return;
    }

    const nowMs = Date.now();
    const lastMs = this.lastSoundAt.get(type) ?? 0;
    if (!bypassCooldown && nowMs - lastMs < this.SOUND_COOLDOWN_MS) {
      return;
    }
    this.lastSoundAt.set(type, nowMs);

    this.unlockAudio();
    const ctx = this.audioCtx;
    if (!ctx) {
      return;
    }

    const steps = this.getSequenceForType(type);
    if (ctx.state === 'running') {
      this.scheduleSequence(ctx, steps);
    } else if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          if (ctx.state === 'running' && !this.isMuted) {
            this.scheduleSequence(ctx, steps);
          }
        })
        .catch(() => {});
    }
  }

  notify(options: AlertNotifyOptions): void {
    if (this.isMuted) {
      return;
    }

    if (options.sound) {
      this.playSound(options.sound);
    }

    if (!this.isBrowserNotificationSupported || Notification.permission !== 'granted') {
      return;
    }

    const tabInactive =
      typeof document !== 'undefined' && (document.hidden || !document.hasFocus());
    if (options.requireHiddenTab !== false && !tabInactive) {
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        tag: options.tag,
        silent: true
      });

      notification.onclick = () => {
        try {
          window.focus();
        } catch {
          // Ignore focus restrictions
        }
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch {
      // Ignore Notification constructor errors in restricted contexts
    }
  }

  private readInitialMutedState(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private bindAudioUnlock(): void {
    if (this.unlockBound || typeof window === 'undefined') {
      return;
    }
    this.unlockBound = true;

    const handleGesture = () => {
      this.unlockAudio();
      if (this.audioCtx?.state === 'running') {
        window.removeEventListener('pointerdown', handleGesture);
        window.removeEventListener('keydown', handleGesture);
      }
    };

    window.addEventListener('pointerdown', handleGesture, { passive: true });
    window.addEventListener('keydown', handleGesture, { passive: true });
  }

  private getSequenceForType(type: AlertSoundType): ToneStep[] {
    switch (type) {
      case 'new-request':
        return [
          { freq: 523.25, delaySec: 0, durationSec: 0.18, gain: 0.08, wave: 'sine' },
          { freq: 659.25, delaySec: 0.11, durationSec: 0.18, gain: 0.08, wave: 'sine' },
          { freq: 783.99, delaySec: 0.22, durationSec: 0.22, gain: 0.08, wave: 'sine' }
        ];
      case 'accepted':
        return [
          { freq: 659.25, delaySec: 0, durationSec: 0.18, gain: 0.085, wave: 'sine' },
          { freq: 987.77, delaySec: 0.12, durationSec: 0.24, gain: 0.085, wave: 'sine' }
        ];
      case 'trip-update':
        return [
          { freq: 587.33, delaySec: 0, durationSec: 0.18, gain: 0.075, wave: 'sine' },
          { freq: 880.0, delaySec: 0.11, durationSec: 0.22, gain: 0.075, wave: 'sine' }
        ];
      case 'chat':
        return [
          { freq: 622.25, delaySec: 0, durationSec: 0.10, gain: 0.055, wave: 'sine' },
          { freq: 783.99, delaySec: 0.06, durationSec: 0.12, gain: 0.06, wave: 'sine' }
        ];
      case 'warning':
        return [
          { freq: 523.25, delaySec: 0, durationSec: 0.18, gain: 0.075, wave: 'triangle' },
          { freq: 392.0, delaySec: 0.14, durationSec: 0.22, gain: 0.075, wave: 'triangle' }
        ];
      case 'toggle-on':
        return [{ freq: 659.25, delaySec: 0, durationSec: 0.09, gain: 0.045, wave: 'sine' }];
    }
  }

  private scheduleSequence(ctx: AudioContext, steps: ToneStep[]): void {
    const baseTime = ctx.currentTime;

    for (const step of steps) {
      const start = baseTime + step.delaySec;
      const end = start + step.durationSec;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = step.wave;
      osc.frequency.setValueAtTime(step.freq, start);

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.linearRampToValueAtTime(step.gain, start + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(start);
      osc.stop(end + 0.02);
    }
  }
}
