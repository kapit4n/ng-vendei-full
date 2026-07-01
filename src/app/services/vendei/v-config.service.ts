import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

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

  baseUrl = environment.apiBaseUrl;

  constructor() { }
}
