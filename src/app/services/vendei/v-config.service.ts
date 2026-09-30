import { Injectable } from '@angular/core';

import { AppConfigService } from '../../core/config/app-config.service';

/**
 * POS-specific configuration (display, printing, offline demo data).
 *
 * Deployment configuration — API base URL, asset base URL, platform — lives in
 * `AppConfigService` and is deliberately NOT duplicated here.
 */
@Injectable({
  providedIn: "root"
})
export class VConfigService {
  /** When true, load products/categories from `assets` JSON instead of the API. */
  isTest = false;

  // cards
  cardImg = { width: 200, height: 200 };

  // invoice related
  printInvoice = false;
  /** When true, show an invoice preview (print/PDF) before saving the order. */
  printInvoiceBeforeSubmit = true;

  /** @deprecated Use `AppConfigService.apiBaseUrl`. Kept for external consumers. */
  get baseUrl(): string {
    return this.appConfig.apiBaseUrl;
  }

  constructor(private readonly appConfig: AppConfigService) {}
}
