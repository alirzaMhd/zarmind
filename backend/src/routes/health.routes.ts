import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health Check Endpoint
 * GET /api/health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'zarmind-api',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Status Endpoint (more detailed)
 * GET /api/status
 */
router.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'zarmind-api',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    },
  });
});

export default router;