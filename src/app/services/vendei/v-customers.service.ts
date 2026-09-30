import { Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

import { VConfigService } from './v-config.service'

@Injectable({
  providedIn: "root"
})
export class VCustomersService {
  /** Product list */
  customers: any[];

  /** Bundled offline/demo customers used when `VConfigService.isTest` is on. */
  private readonly jsonFileURL = 'assets/vendei/customers.json';

  /** Product List service constructor */
  constructor(
    private readonly api: ApiClientService,
    private readonly configSvc: VConfigService
  ) {}

  /**
   * Returns the list of products
   */
  list(): any[] {
    return this.customers;
  }

  /**
   * Return an observable with the yeam that matches the id
   */
  getCustomerById(id: any): Observable<any> {
    return this.api.getAsset<any>(this.jsonFileURL).pipe(
      map((response: any) => {
        return <any>response.json()[id - 1];
      })
    );
  }

  /**
   * Return an observable with the list of products
   */
  getAll(): Observable<any> {
    if (this.configSvc.isTest) {
      return this.api.getAsset<any>(this.jsonFileURL);
    }
    return this.api.get<any>(API_PATHS.clients);
  }
}
