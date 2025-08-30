import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';

// Import routes
import ussdRoutes from './routes/ussd';
import smsRoutes from './routes/sms';
import paymentRoutes from './routes/payment';

// Import database
import './db';

export async function createApp(): Promise<FastifyInstance> {
  // Configure logger based on environment
  const loggerConfig = env.NODE_ENV === 'development' ? {
    level: 'info',
    // Simple development logging without external transport
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: err.stack,
      }),
    },
  } : {
    level: 'warn',
  };

  const fastify = Fastify({
    logger: loggerConfig,
    trustProxy: true,
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API usage
  });

  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_request, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
  });

  // Global error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.validation,
      });
    }

    // Handle other errors
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    return reply.status(statusCode).send({
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'development' ? message : 'Something went wrong',
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });

  // Global not found handler
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: 'Route not found',
    });
  });

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: process.env['npm_package_version'] || '1.0.0',
    });
  });

  // Root endpoint
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      message: 'Split-Bill Platform API',
      version: '1.0.0',
      documentation: '/docs',
      health: '/health',
      services: {
        ussd: '/api/v1/ussd',
        sms: '/api/v1/sms',
        payment: '/api/v1/payment',
      },
    });
  });

  // Register routes
  await fastify.register(ussdRoutes, { prefix: '/api/v1' });
  await fastify.register(smsRoutes, { prefix: '/api/v1' });
  await fastify.register(paymentRoutes, { prefix: '/api/v1' });

  return fastify;
}
