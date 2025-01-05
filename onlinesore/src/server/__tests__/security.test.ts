import request from 'supertest';
import express from 'express';
import { securityMiddleware, sanitizeInput } from '../middleware/security';
import { authLimiter, apiLimiter } from '../middleware/rateLimiter';
import { authRouter } from '../routes/auth';

const app = express();
app.use(express.json());
app.use(securityMiddleware);
app.use(sanitizeInput);
app.use('/api/auth', authLimiter, authRouter);

describe('Security Measures', () => {
  it('blocks requests without CSRF token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CSRF token missing');
  });

  it('sanitizes malicious input', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('x-csrf-token', 'valid-token')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: '<script>alert("xss")</script>'
      });

    expect(response.status).toBe(200);
    // Verify that script tags were removed
    expect(response.body.name).not.toContain('<script>');
  });

  it('enforces rate limiting', async () => {
    // Make 6 requests (more than limit)
    for (let i = 0; i < 6; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', 'valid-token')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      if (i < 5) {
        expect(response.status).not.toBe(429);
      } else {
        expect(response.status).toBe(429);
        expect(response.body.error).toContain('Too many');
      }
    }
  });
}); 