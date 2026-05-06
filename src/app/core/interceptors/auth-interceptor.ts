import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('>>> interceptor called, url:', req.url);
  const token = localStorage.getItem('token');
  console.log('>>> token:', token ? 'exists' : 'null');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};