import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { smsService } from '../services/smsService';

// Request validation schema for SMS
const sendSMSRequestSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(160, 'Message too long'),
});

const bulkSMSRequestSchema = z.object({
  messages: z.array(z.object({
    to: z.string().min(1, 'Phone number is required'),
    message: z.string().min(1, 'Message is required').max(160, 'Message too long'),
  })).min(1, 'At least one message is required').max(100, 'Maximum 100 messages allowed'),
});

export default async function smsRoutes(fastify: FastifyInstance) {
  // Send single SMS
  fastify.post('/sms/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = sendSMSRequestSchema.parse(request.body);
      
      // Send SMS
      const result = await smsService.sendSMS({
        to: body.to,
        message: body.message,
      });

      if (result.success) {
        return reply.send({
          success: true,
          messageId: result.messageId,
          message: 'SMS sent successfully',
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: result.error,
          message: 'Failed to send SMS',
        });
      }
    } catch (error) {
      fastify.log.error('SMS sending error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to send SMS',
      });
    }
  });

  // Send bulk SMS
  fastify.post('/sms/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = bulkSMSRequestSchema.parse(request.body);
      
      // Send SMS in parallel
      const results = await Promise.all(
        body.messages.map(async (msg) => {
          const result = await smsService.sendSMS({
            to: msg.to,
            message: msg.message,
          });
          
          return {
            to: msg.to,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          };
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return reply.send({
        success: true,
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results,
      });
    } catch (error) {
      fastify.log.error('Bulk SMS sending error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to send bulk SMS',
      });
    }
  });

  // Health check endpoint for SMS service
  fastify.get('/sms/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: 'healthy',
      service: 'SMS',
      provider: 'Briq',
      timestamp: new Date().toISOString(),
    });
  });
}
