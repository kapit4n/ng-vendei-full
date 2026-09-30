import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ACTIONS, API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

export interface UploadImageResponse {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class RUploadService {
  constructor(private readonly api: ApiClientService) {}

  /** POST multipart field name: `file`. Returns root-relative URL e.g. `/uploads/products/….jpg`. */
  uploadProductImage(file: File): Observable<UploadImageResponse> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.api.post<UploadImageResponse>(
      `${API_PATHS.products}/${API_ACTIONS.uploadImage}`,
      body
    );
  }
}
