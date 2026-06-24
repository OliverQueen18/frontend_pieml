import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Délai d'inactivité avant déconnexion automatique (30 minutes). */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;

@Injectable({ providedIn: 'root' })
export class SessionIdleService {
  private auth = inject(AuthService);
  private timer?: ReturnType<typeof setTimeout>;
  private listenersBound = false;

  private readonly onActivity = () => {
    if (this.auth.isLoggedIn()) {
      this.scheduleLogout();
    }
  };

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.scheduleLogout();
      } else {
        this.clearTimer();
      }
    });
  }

  init() {
    if (this.listenersBound) return;
    this.listenersBound = true;

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.onActivity, { passive: true });
    });
  }

  private scheduleLogout() {
    this.clearTimer();
    this.timer = setTimeout(() => {
      if (this.auth.isLoggedIn()) {
        this.auth.logout();
      }
    }, IDLE_TIMEOUT_MS);
  }

  private clearTimer() {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
