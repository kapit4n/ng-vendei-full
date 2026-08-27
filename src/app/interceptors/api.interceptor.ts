import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Global HTTP error interceptor.  Logs and standardises common error codes.
 * URL prefixing is handled by each service via VConfigService.baseUrl.
 */
export const apiInterceptor: HttpInterceptorFn = (_req, next) => {
  return next(_req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'An unexpected error occurred.';
      if (err.status === 0) {
        message = 'Cannot reach the server. Check your network connection.';
      } else if (err.status === 404) {
        message = 'Resource not found.';
      } else if (err.status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (err.error?.error) {
        message = err.error.error;
      }
      console.error(`[API Error] ${err.status}: ${message}`, err);
      return throwError(() => err);
    }),
  );
};
