import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, catchError, mergeMap, throwError } from 'rxjs';
import { GetTokenSilentlyVerboseResponse } from '@auth0/auth0-spa-js';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {

  constructor(private auth: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.auth.getTokenSilently$().pipe(
      mergeMap((token: GetTokenSilentlyVerboseResponse) =>{
        const tokenReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token.access_token}`}
        });
        return next.handle(tokenReq);
      }),
      catchError(err => throwError(() => err))
    );
  }
}
