import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityMiddleware = [
  helmet(), // Adds various HTTP headers for security
  (req: Request, res: Response, next: NextFunction) => {
    // Add CSRF token validation
    const csrfToken = req.headers['x-csrf-token'];
    if (req.method !== 'GET' && !csrfToken) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }
    next();
  }
];

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body and parameters
  const sanitize = (obj: any) => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[<>]/g, ''); // Basic XSS prevention
      }
    });
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}; 