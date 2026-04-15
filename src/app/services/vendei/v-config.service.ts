import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: "root"
})
export class VConfigService {

  isTest: false;

  // cards
  cardImg: { width: 200, height: 200 }
  
  // invoice related
  printInvoice: false;

  baseUrl = environment.apiBaseUrl;

  constructor() { }
}
