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
  /** When true, show an invoice preview (print/PDF) before saving the order. */
  printInvoiceBeforeSubmit = true;

  baseUrl = environment.apiBaseUrl;

  constructor() { }
}
