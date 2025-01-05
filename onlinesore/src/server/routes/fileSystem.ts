import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

router.get('/list', async (req, res, next) => {
  try {
    const dirPath = req.query.path as string || '/';
    const files = await fs.readdir(path.join(process.cwd(), dirPath));
    
    const fileNodes = await Promise.all(files.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      return {
        id: Buffer.from(filePath).toString('base64'),
        name: file,
        type: stats.isDirectory() ? 'directory' : 'file',
        path: filePath
      };
    }));
    
    res.json(fileNodes);
  } catch (error) {
    next(error);
  }
});

router.get('/read', async (req, res, next) => {
  try {
    const filePath = req.query.path as string;
    const content = await fs.readFile(path.join(process.cwd(), filePath), 'utf-8');
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

export { router as fileSystemRouter }; 