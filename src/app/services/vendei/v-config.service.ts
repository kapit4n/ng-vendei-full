import { Injectable } from '@angular/core';

@Injectable({
  providedIn: "root"
})
export class VConfigService {

  isTest: true;
  cardImg: { width: 200, height: 200 }
  baseUrl = "http://localhost:3000/api";

  constructor() { }
}
