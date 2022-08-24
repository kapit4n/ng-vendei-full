import { Injectable } from '@angular/core';

@Injectable({
  providedIn: "root"
})
export class VConfigService {

  isTest: false;

  // cards
  cardImg: { width: 200, height: 200 }
  
  // invoice related
  printInvoice: false;

  baseUrl = "http://localhost:3000";

  constructor() { }
}
