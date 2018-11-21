import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RepConfigService {

  baseUrl = "http://localhost:3000/api";
  constructor() { }
}
