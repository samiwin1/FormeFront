import { OverlayModule } from '@angular/cdk/overlay';
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';
import { OnboardingOverlayComponent } from './shared/components/onboarding-overlay/onboarding-overlay.component';

@Component({
  selector: 'app-root',
  imports: [OverlayModule, RouterOutlet, ToastComponent, OnboardingOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'forme-frontend';
  private keyboardShortcuts = inject(KeyboardShortcutsService);

  ngOnInit(): void {
    this.keyboardShortcuts.init();
  }
}
