import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfigService } from '../config/app-config.service';

/**
 * Query parameters accepted by the client.
 *
 *  - `string` — passed through verbatim. Used where the backend expects
 *    Sequelize filter syntax (`filter[include]=product`), which must not be
 *    re-encoded to keep the existing requests byte-identical.
 *  - `HttpParams` — caller-built.
 *  - `Record` — plain values; encoded with `HttpParams`. `null`/`undefined` are dropped.
 */
export type ApiQueryParams =
  string | HttpParams | Record<string, string | number | boolean | null | undefined> | undefined;

/**
 * The single place where an HTTP request becomes a URL.
 *
 * Feature services depend on this instead of `HttpClient` + `environment`, so
 * the base URL, the resource paths and the query encoding are decided in one
 * spot. Endpoint behaviour is unchanged.
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: AppConfigService
  ) {}

  /** Absolute URL for an API path, without query string. */
  url(path: string): string {
    return this.config.apiUrl(path);
  }

  get<T>(path: string, params?: ApiQueryParams): Observable<T> {
    return this.http.get<T>(this.withParams(path, params));
  }

  post<T>(path: string, body: unknown, params?: ApiQueryParams): Observable<T> {
    return this.http.post<T>(this.withParams(path, params), body);
  }

  put<T>(path: string, body: unknown, params?: ApiQueryParams): Observable<T> {
    return this.http.put<T>(this.withParams(path, params), body);
  }

  delete<T>(path: string, params?: ApiQueryParams): Observable<T> {
    return this.http.delete<T>(this.withParams(path, params));
  }

  /**
   * Fetch a JSON file bundled with the app (offline/demo data), resolved
   * against the asset base rather than the API base.
   */
  getAsset<T>(path: string): Observable<T> {
    return this.http.get<T>(this.config.assetUrl(path));
  }

  private withParams(path: string, params?: ApiQueryParams): string {
    const url = this.url(path);
    if (params === undefined) {
      return url;
    }
    if (typeof params === 'string') {
      const qs = params.replace(/^\?/, '');
      return qs ? `${url}?${qs}` : url;
    }
    const httpParams = params instanceof HttpParams ? params : toHttpParams(params);
    const qs = httpParams.toString();
    return qs ? `${url}?${qs}` : url;
  }
}

function toHttpParams(params: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }
    httpParams = httpParams.set(key, String(value));
  }
  return httpParams;
}
