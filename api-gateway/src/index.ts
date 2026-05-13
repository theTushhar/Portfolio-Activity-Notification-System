import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;
const portfolioServiceUrl = process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:3001';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002';

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000 // 1000 requests per minute
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Helper to cast response
const sendError = (res: express.Response, statusCode: number, message: string) => {
  if (!res.headersSent) {
    res.status(statusCode).json({ error: message });
  }
};

// Portfolio service proxy
const portfolioProxy = createProxyMiddleware({
  target: portfolioServiceUrl,
  changeOrigin: true,
  pathRewrite: (path) => `/api${path}`,
  on: {
    error: (err, req, res) => {
      logger.error('Portfolio proxy error', { error: err.message, path: (req as express.Request).path });
      sendError(res as express.Response, 502, 'Bad Gateway');
    }
  }
});

app.use('/api/portfolio', portfolioProxy);

// Notification service proxy
const notificationProxy = createProxyMiddleware({
  target: notificationServiceUrl,
  changeOrigin: true,
  pathRewrite: (path) => `/api${path}`,
  on: {
    error: (err, req, res) => {
      logger.error('Notification proxy error', { error: err.message, path: (req as express.Request).path });
      sendError(res as express.Response, 502, 'Bad Gateway');
    }
  }
});

app.use('/api/notifications', notificationProxy);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});
