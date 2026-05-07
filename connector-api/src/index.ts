import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/auth.js';
import providerRoutes from './routes/provider-proxy.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*', 'moz-extension://*'],
  credentials: true
}));

app.use(express.json());

// Request ID tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = uuidv4();
  console.log(`[${req.id}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/provider', providerRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[${req.id}] Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id,
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Declare global types for Express
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

app.listen(PORT, () => {
  console.log(`🚀 AI Assistant Connector API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Allowed origins: ${process.env.ALLOWED_ORIGINS || 'chrome-extension://* (default)'}`);
});

export default app;
