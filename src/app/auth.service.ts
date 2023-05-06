import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth0Client, GetTokenSilentlyVerboseResponse, createAuth0Client } from '@auth0/auth0-spa-js';
import { BehaviorSubject, Observable, catchError, combineLatest, concatMap, from, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  auth0Client$ = (from(
    createAuth0Client({
      domain: environment.domain,
      clientId: environment.clientId,
      authorizationParams: {
        redirect_uri: `${window.location.origin}`,
        audience: environment.audience 
      }
    })
  ) as Observable<Auth0Client>).pipe(
    shareReplay(1),
    catchError(err => throwError(() => err))
  );

  isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client)=> from(client.isAuthenticated())),
    tap(res => this.loggedIn = res)
  );

  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback()))
  );

  private userProfileSubject$ = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject$.asObservable();
  loggedIn: boolean = false;
  constructor(private router: Router) {
    this.localAuthSetup();
    this.handleAuthCallback();
   }

   //  getTokenSilently$(options?): Observable<string> {
   getTokenSilently$(options?:any): Observable<GetTokenSilentlyVerboseResponse> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getTokenSilently(options))),
    );
  }

  getUser$(options?:any): Observable<any> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser())),
      tap(user => this.userProfileSubject$.next(user))
    );
  }

  private localAuthSetup() {
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn:boolean) =>{
        if(loggedIn) {
          return this.getUser$();
        }
        return of(loggedIn);
      })
    );
    checkAuth$.subscribe();
  }

  login(redirectPath: string = '/') {
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log in
      client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: `${window.location.origin}`,
        },
        appState: { target: redirectPath }
      });
    });
  }

  private handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    if (params.includes('code=') && params.includes('state=')) {
      let targetRoute: string; // Path to redirect to after login processsed
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap(cbRes => {
          // Get and set target redirect route from callback results
          targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
        }),
        concatMap(() => {
          // Redirect callback complete; get user and login status
          return combineLatest([
            this.getUser$(),
            this.isAuthenticated$
          ]);
        })
      );
      // Subscribe to authentication completion observable
      // Response will be an array of user and login status
      authComplete$.subscribe(([user, loggedIn]) => {
        // Redirect to target route after callback processing
        this.router.navigate([targetRoute]);
      });
    }
  }

  logout() {
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log out
      client.logout({
        clientId: environment.clientId,
        logoutParams: {
          returnTo: `${window.location.origin}`
        }
      });
    });
  }

}
