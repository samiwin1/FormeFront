import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NgIf, HeaderComponent, FooterComponent],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {
  private readonly router = inject(Router);

  hideFooterForCurrentRoute(): boolean {
    return (
      this.router.url.startsWith('/me/certification-list') ||
      this.router.url.startsWith('/me/certification-space') ||
      this.router.url.startsWith('/evaluator/oral-assignments') ||
      this.router.url.startsWith('/formations') ||
      this.router.url.startsWith('/events') ||
      this.router.url.startsWith('/me/mentor')
    );
  }
}
