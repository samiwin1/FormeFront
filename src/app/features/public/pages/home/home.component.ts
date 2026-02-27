import { AfterViewInit, Component } from '@angular/core';

declare const AOS: any;

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    if (typeof AOS !== 'undefined') {
      AOS.init({ once: true, duration: 800 });
      AOS.refresh();
    }
  }
}
