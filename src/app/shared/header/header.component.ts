import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private auth = inject(AuthService);

  isLoggedIn$ = this.auth.isLoggedIn$;

  mobileOpen = false;
  menuOpen = false;

  logout() {
    this.auth.logout();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  closeAll() {
    this.mobileOpen = false;
    this.menuOpen = false;
  }

  // Close dropdown if click outside
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.fm-dropdown')) this.menuOpen = false;
  }

  // Close mobile menu on Escape
  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeAll();
  }
}