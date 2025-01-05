import request from 'supertest';
import express from 'express';
import { gitRouter } from '../routes/git';
import { fileSystemRouter } from '../routes/fileSystem';
import { aiRouter } from '../routes/ai';

const app = express();
app.use(express.json());
app.use('/api/git', gitRouter);
app.use('/api/fs', fileSystemRouter);
app.use('/api/ai', aiRouter);

describe('API Endpoints', () => {
  describe('Git API', () => {
    it('gets git status', async () => {
      const response = await request(app).get('/api/git/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('branch');
    });

    it('lists branches', async () => {
      const response = await request(app).get('/api/git/branches');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('branches');
      expect(Array.isArray(response.body.branches)).toBe(true);
    });
  });

  describe('File System API', () => {
    it('lists files', async () => {
      const response = await request(app).get('/api/fs/list');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('AI API', () => {
    it('generates completion', async () => {
      const response = await request(app)
        .post('/api/ai/completion')
        .send({ prompt: 'Test prompt' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('completion');
      expect(response.body).toHaveProperty('alternatives');
    });
  });
}); 