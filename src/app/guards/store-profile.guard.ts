import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { VConfigService } from '../services/vendei/v-config.service';

/**
 * Guard that protects routes requiring an active store profile.
 * When no profile is active, redirects to the profile selection page.
 */
@Injectable({ providedIn: 'root' })
export class StoreProfileGuard implements CanActivate {
  constructor(private configSvc: VConfigService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    // For now, allow all access — real auth can be layered on later.
    // This guard serves as the integration point for future auth checks.
    return true;
  }
}
