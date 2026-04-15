import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';


@Component({
  selector: 'app-header',
  imports: [NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
    mobileOpen = false;
  menuOpen = false;
   public auth = inject(AuthService);
  private router = inject(Router);
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  
  toggleSidebar(event: Event) {
    event.preventDefault();
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('minimenu')) {
      htmlElement.classList.remove('minimenu');
    } else {
      htmlElement.classList.add('minimenu');
    }
  }

  closeAll() {
    this.mobileOpen = false;
    this.menuOpen = false;
  }

}
