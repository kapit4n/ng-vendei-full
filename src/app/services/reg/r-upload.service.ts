import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RConfigService } from './r-config.service';

export interface UploadImageResponse {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class RUploadService {
  constructor(private http: HttpClient, private configSvc: RConfigService) {}

  /** POST multipart field name: `file`. Returns root-relative URL e.g. `/uploads/products/….jpg`. */
  uploadProductImage(file: File): Observable<UploadImageResponse> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<UploadImageResponse>(
      `${this.configSvc.baseUrl}/products/upload-image`,
      body
    );
  }
}
