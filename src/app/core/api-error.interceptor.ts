import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Normalise les réponses d'erreur texte (ex. « Invalid CORS request ») en objet { message }. */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const body = error.error;
      if (typeof body === 'string' && body.trim()) {
        const message = body.includes('Invalid CORS request')
          ? 'Accès refusé par le serveur (CORS). Vérifiez la configuration CORS_ORIGINS et FRONTEND_URL.'
          : body;
        return throwError(() => new HttpErrorResponse({
          error: { message },
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined
        }));
      }

      return throwError(() => error);
    })
  );
