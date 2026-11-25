import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'taxi_theme_mode';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeSubject: BehaviorSubject<ThemeMode>;
  readonly theme$;

  constructor() {
    const initial = this.readInitialTheme();
    this.themeSubject = new BehaviorSubject<ThemeMode>(initial);
    this.theme$ = this.themeSubject.asObservable();
    this.applyTheme(initial);
  }

  get currentTheme(): ThemeMode {
    return this.themeSubject.getValue();
  }

  get isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  toggleTheme(): void {
    this.setTheme(this.isDark ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.themeSubject.next(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
    this.applyTheme(mode);
  }

  private readInitialTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark-theme', mode === 'dark');
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
  }
}
