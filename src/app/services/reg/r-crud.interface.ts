import { Observable } from "rxjs";

/**
 * Shape shared by the CRUD feature services.
 *
 * URL construction is no longer part of this contract: paths are declared once
 * in `core/api/api-paths` and resolved by `ApiClientService`.
 */
export interface RCrudInterface {
  getAll(): Observable<object>;
  save(data): Observable<object>;
}
