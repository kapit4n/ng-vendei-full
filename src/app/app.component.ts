import { Component, OnDestroy } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnDestroy {
  title = 'app';

  /** Normalized path without query (e.g. `/`, `/main`, `/reg/products`). */
  currentPath = '/';

  private readonly navSub: Subscription;

  constructor(private readonly router: Router) {
    this.currentPath = this.normalizePath(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentPath = this.normalizePath(this.router.url);
      });
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
  }

  /** True when the POS (shopping cart) route is active. */
  get isPosShell(): boolean {
    const p = this.currentPath;
    return p === '/' || p === '';
  }

  private normalizePath(url: string): string {
    const path = (url || '').split('?')[0] || '/';
    if (!path.startsWith('/')) {
      return '/' + path;
    }
    return path === '' ? '/' : path;
  }
}
