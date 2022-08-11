import { Observable } from "rxjs";

export interface RCrudInterface {
  modelUrl: string;
  getAll(): Observable<object>;
  save(data): Observable<object>;
}
