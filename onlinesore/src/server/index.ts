import express from 'express';
import cors from 'cors';
import { authLimiter, apiLimiter, aiLimiter } from './middleware/rateLimiter';
import { securityMiddleware, sanitizeInput } from './middleware/security';
import { authRouter } from './routes/auth';
import { gitRouter } from './routes/git';
import { fileSystemRouter } from './routes/fileSystem';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// Security configurations
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(securityMiddleware);
app.use(sanitizeInput);
app.use(requestLogger);

// Public routes
app.use('/api/auth', authLimiter, authRouter);

// Protected routes
app.use('/api/git', apiLimiter, authMiddleware, gitRouter);
app.use('/api/fs', apiLimiter, authMiddleware, fileSystemRouter);
app.use('/api/ai', aiLimiter, authMiddleware, aiRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 