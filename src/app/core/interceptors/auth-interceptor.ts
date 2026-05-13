import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('>>> interceptor called, url:', req.url);
  const token = localStorage.getItem('token');
  console.log('>>> token:', token ? 'exists' : 'null');

  req = req.clone({
    setHeaders: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return next(req);
};