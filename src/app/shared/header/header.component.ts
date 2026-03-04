import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-header',
  standalone: true,
imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  private auth = inject(AuthService);
  private cartService = inject(CartService);

  isLoggedIn$ = this.auth.isLoggedIn$;
  cartCount$: Observable<number>;

  mobileOpen = false;
  menuOpen = false;

  constructor() {
    this.cartCount$ = this.cartService.cartCount$;
  }

  ngOnInit(): void {
    this.auth.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        const token = localStorage.getItem('forme_token');
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            const userId = decoded.uid;
            this.cartService.refreshCartCount(userId);
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }
      }
    });
  }

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