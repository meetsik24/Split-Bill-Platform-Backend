import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { billService } from '../services/billService';

// Request validation schema for mock payment
const mockPaymentRequestSchema = z.object({
  billId: z.number().int().positive('Bill ID must be a positive integer'),
  memberPhone: z.string().min(1, 'Member phone number is required'),
});

// Request validation schema for bill creation
const createBillRequestSchema = z.object({
  creatorPhone: z.string().min(1, 'Creator phone number is required'),
  creatorName: z.string().min(1, 'Creator name is required'),
  amount: z.number().positive('Amount must be positive'),
  memberPhones: z.array(z.string().min(1, 'Phone numbers cannot be empty')).min(1, 'At least one member is required'),
  description: z.string().optional(),
});

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Mock payment endpoint
  fastify.post('/payment/mock', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = mockPaymentRequestSchema.parse(request.body);
      
      // Process mock payment
      const success = await billService.markPaymentAsPaid(body.billId, body.memberPhone);
      
      if (success) {
        return reply.send({
          success: true,
          message: 'Payment processed successfully',
          billId: body.billId,
          memberPhone: body.memberPhone,
          timestamp: new Date().toISOString(),
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: 'Payment processing failed',
          message: 'Bill or member not found, or payment already processed',
        });
      }
    } catch (error) {
      fastify.log.error('Mock payment error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to process payment',
      });
    }
  });

  // Create bill endpoint (alternative to USSD)
  fastify.post('/bills', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = createBillRequestSchema.parse(request.body);
      
      // Create bill
      const bill = await billService.createBill(body);
      
      return reply.status(201).send({
        success: true,
        message: 'Bill created successfully',
        bill: {
          id: bill.id,
          amount: bill.amount,
          description: bill.description,
          creator: {
            name: bill.creator.name,
            phone: bill.creator.phone,
          },
          members: bill.members.map(member => ({
            phone: member.member_phone,
            amount: member.amount,
            status: member.status,
          })),
          created_at: bill.created_at,
        },
      });
    } catch (error) {
      fastify.log.error('Bill creation error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create bill',
      });
    }
  });

  // Get bill by ID
  fastify.get('/bills/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const billId = parseInt(id, 10);
      
      if (isNaN(billId) || billId <= 0) {
        return reply.status(400).send({
          error: 'Invalid bill ID',
          message: 'Bill ID must be a positive integer',
        });
      }
      
      const bill = await billService.getBillById(billId);
      
      if (!bill) {
        return reply.status(404).send({
          error: 'Bill not found',
          message: `Bill with ID ${billId} does not exist`,
        });
      }
      
      return reply.send({
        success: true,
        bill: {
          id: bill.id,
          amount: bill.amount,
          description: bill.description,
          creator: {
            name: bill.creator.name,
            phone: bill.creator.phone,
          },
          members: bill.members.map(member => ({
            phone: member.member_phone,
            amount: member.amount,
            status: member.status,
            paid_at: member.paid_at,
          })),
          created_at: bill.created_at,
        },
      });
    } catch (error) {
      fastify.log.error('Get bill error:', error);
      
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve bill',
      });
    }
  });

  // Get bills by creator phone
  fastify.get('/bills/creator/:phone', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phone } = request.params as { phone: string };
      
      if (!phone || phone.trim() === '') {
        return reply.status(400).send({
          error: 'Invalid phone number',
          message: 'Phone number is required',
        });
      }
      
      const bills = await billService.getBillsByCreator(phone.trim());
      
      return reply.send({
        success: true,
        bills: bills.map(bill => ({
          id: bill.id,
          amount: bill.amount,
          description: bill.description,
          created_at: bill.created_at,
        })),
        count: bills.length,
      });
    } catch (error) {
      fastify.log.error('Get bills by creator error:', error);
      
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve bills',
      });
    }
  });

  // Health check endpoint for payment service
  fastify.get('/payment/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: 'healthy',
      service: 'Payment',
      timestamp: new Date().toISOString(),
    });
  });
}
