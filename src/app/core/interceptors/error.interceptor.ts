import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 && !auth.getToken()) {
        // Only redirect to login when the token is genuinely missing or expired,
        // not when a specific endpoint returns 401 for another reason.
        auth.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};
