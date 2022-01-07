import { Injectable } from '@angular/core';

@Injectable({
  providedIn: "root"
})
export class VConfigService {

  isTest: false;
  cardImg: { width: 200, height: 200 }
  baseUrl = "http://localhost:3000";

  constructor() { }
}
