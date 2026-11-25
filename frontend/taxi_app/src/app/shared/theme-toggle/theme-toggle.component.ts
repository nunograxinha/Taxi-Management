import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../appServices/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css']
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  @Input() showLabel = false;
  isDark = false;
  private sub = new Subscription();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.isDark = this.themeService.isDark;
    this.sub.add(
      this.themeService.theme$.subscribe((mode) => {
        this.isDark = mode === 'dark';
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggle(): void {
    this.themeService.toggleTheme();
  }
}
