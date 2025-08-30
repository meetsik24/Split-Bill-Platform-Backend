import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ussdService } from '../services/ussdService';
import { logger } from '../utils/logger';

// Request validation schema for Africa's Talking USSD
const ussdRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  serviceCode: z.string().min(1, 'Service code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  text: z.string().optional().default(''),
});

export default async function ussdRoutes(fastify: FastifyInstance) {
  // USSD callback endpoint for Africa's Talking
  fastify.post('/ussd', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Log incoming USSD request
      logger.logUSSDRequest(
        (request.body as any)?.sessionId || 'unknown',
        (request.body as any)?.phoneNumber || 'unknown',
        (request.body as any)?.text || ''
      );

      // Validate request body
      const body = ussdRequestSchema.parse(request.body);
      
      // Process USSD request
      const response = await ussdService.processUSSDRequest({
        sessionId: body.sessionId,
        serviceCode: body.serviceCode,
        phoneNumber: body.phoneNumber,
        text: body.text,
      });

      // Log USSD response
      logger.logUSSDResponse(
        response.sessionId,
        response.status,
        response.message
      );

      // Return response in Africa's Talking format
      return reply.send(response);
    } catch (error) {
      fastify.log.error('USSD processing error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to process USSD request',
      });
    }
  });

  // Health check endpoint for USSD service
      fastify.get('/ussd/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: 'healthy',
      service: 'USSD',
      provider: 'Africa\'s Talking',
      timestamp: new Date().toISOString(),
      sessionCount: ussdService.getSessionCount?.() || 'N/A',
    });
  });

  // Debug endpoint to view session information (development only)
  if (process.env['NODE_ENV'] === 'development') {
    fastify.get('/ussd/sessions/:sessionId', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { sessionId } = request.params as { sessionId: string };
        const sessionInfo = ussdService.getSessionInfo(sessionId);
        
        if (!sessionInfo) {
          return reply.status(404).send({
            error: 'Session not found',
            message: `No session found with ID: ${sessionId}`,
          });
        }
        
        return reply.send({
          sessionId,
          sessionInfo,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        fastify.log.error('Session info error:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve session info',
        });
      }
    });

    // Clear all sessions (development only)
    fastify.delete('/ussd/sessions', async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        ussdService.clearAllSessions();
        return reply.send({
          message: 'All sessions cleared successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        fastify.log.error('Clear sessions error:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to clear sessions',
        });
      }
    });
  }
}
