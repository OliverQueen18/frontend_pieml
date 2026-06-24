import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionIdleService } from './core/session-idle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [`:host { display: block; min-height: 100vh; }`]
})
export class AppComponent implements OnInit {
  private sessionIdle = inject(SessionIdleService);

  ngOnInit() {
    this.sessionIdle.init();
  }
}
