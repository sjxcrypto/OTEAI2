import request from 'supertest';
import express from 'express';
import { authRouter } from '../routes/auth';
import { authMiddleware } from '../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Protected test route
app.use('/api/protected', authMiddleware, (req, res) => {
  res.json({ success: true });
});

describe('Authentication', () => {
  let authToken: string;

  it('registers a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    authToken = response.body.token;
  });

  it('logs in existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('protects routes with authentication', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  it('rejects invalid tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
}); 