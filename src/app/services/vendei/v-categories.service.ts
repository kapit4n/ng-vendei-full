import { Injectable } from '@angular/core';

import { HttpClient } from "@angular/common/http";
import { Observable, Subject, of, config } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';

import { VConfigService } from './v-config.service'

import 'rxjs'; //get everything from Rx    

@Injectable({
  providedIn: 'root'
})
export class VCategoriesService {
  private jsonFileURL: string = "../../assets/vendei/categories.json";
  private categoriesURL: string = "http://localhost:3000/api/categories";

  constructor(private http: HttpClient, private configSvc: VConfigService) { }
  
  /**
   * Return an observable with the list of categories
   */
  getAll(): Observable<any> {
    if (this.configSvc.isTest) {
      return this.http.get(this.jsonFileURL).pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
    } else {
      return this.http
        .get(this.categoriesURL)
        .pipe(
          map((response: Response) => {
            return <any>response;
          })
        );
    }
  }
}
