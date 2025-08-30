import { db } from '../db';
import { bills, billMembers, users } from '../db/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { smsService } from './smsService';
import type { NewBill, NewBillMember, Bill, BillMember } from '../db/schema';

export interface CreateBillRequest {
  creatorPhone: string;
  creatorName: string;
  amount: number;
  memberPhones: string[];
  description?: string;
}

export interface BillWithMembers extends Bill {
  creator: { name: string; phone: string };
  members: Array<BillMember & { memberName?: string }>;
}

export class BillService {
  /**
   * Create a new bill and add members
   */
  async createBill(request: CreateBillRequest): Promise<BillWithMembers> {
    // Start transaction
    return await db.transaction(async (tx) => {
      // Create or get user
      let user = await tx.select().from(users).where(eq(users.phone, request.creatorPhone)).limit(1);
      
      if (user.length === 0) {
        const [newUser] = await tx.insert(users).values({
          name: request.creatorName,
          phone: request.creatorPhone,
        }).returning();
        user = [newUser];
      }

      // Create bill
      const [bill] = await tx.insert(bills).values({
        creator_id: user[0].id,
        amount: request.amount,
        description: request.description,
      }).returning();

      // Calculate amount per member
      const amountPerMember = request.amount / request.memberPhones.length;

      // Add members
      const memberPromises = request.memberPhones.map(async (phone) => {
        const [member] = await tx.insert(billMembers).values({
          bill_id: bill.id,
          member_phone: phone,
          amount: amountPerMember,
          status: 'pending',
        }).returning();

        // Send SMS notification
        await smsService.sendBillSplitRequest(
          phone,
          amountPerMember,
          request.creatorName
        );

        return member;
      });

      const members = await Promise.all(memberPromises);

      // Get bill with relations
      const [billWithRelations] = await tx
        .select({
          ...bills,
          creator: {
            name: users.name,
            phone: users.phone,
          },
        })
        .from(bills)
        .leftJoin(users, eq(bills.creator_id, users.id))
        .where(eq(bills.id, bill.id));

      return {
        ...billWithRelations,
        members: members.map(member => ({
          ...member,
          memberName: undefined, // Will be populated if needed
        })),
      };
    });
  }

  /**
   * Get bill by ID with all details
   */
  async getBillById(billId: number): Promise<BillWithMembers | null> {
    const billData = await db
      .select({
        ...bills,
        creator: {
          name: users.name,
          phone: users.phone,
        },
      })
      .from(bills)
      .leftJoin(users, eq(bills.creator_id, users.id))
      .where(eq(bills.id, billId));

    if (billData.length === 0) return null;

    const members = await db
      .select()
      .from(billMembers)
      .where(eq(billMembers.bill_id, billId));

    return {
      ...billData[0],
      members,
    };
  }

  /**
   * Mark a member's payment as paid
   */
  async markPaymentAsPaid(billId: number, memberPhone: string): Promise<boolean> {
    const result = await db
      .update(billMembers)
      .set({
        status: 'paid',
        paid_at: new Date(),
      })
      .where(
        and(
          eq(billMembers.bill_id, billId),
          eq(billMembers.member_phone, memberPhone)
        )
      );

    if (result.rowCount === 0) return false;

    // Get bill details for SMS updates
    const bill = await this.getBillById(billId);
    if (!bill) return false;

    // Get payment statistics
    const [paidCount] = await db
      .select({ count: count() })
      .from(billMembers)
      .where(
        and(
          eq(billMembers.bill_id, billId),
          eq(billMembers.status, 'paid')
        )
      );

    const [totalCount] = await db
      .select({ count: count() })
      .from(billMembers)
      .where(eq(billMembers.bill_id, billId));

    // Send SMS updates
    await this.sendPaymentUpdates(bill, paidCount.count, totalCount.count);

    return true;
  }

  /**
   * Send payment update SMS to all members
   */
  private async sendPaymentUpdates(bill: BillWithMembers, paidCount: number, totalCount: number): Promise<void> {
    const updatePromises = bill.members.map(async (member) => {
      if (member.status === 'pending') {
        // Send update to pending members
        await smsService.sendPaymentUpdate(
          member.member_phone,
          paidCount,
          totalCount,
          Number(bill.amount)
        );
      } else if (member.status === 'paid') {
        // Send confirmation to paid members
        await smsService.sendPaymentConfirmation(
          member.member_phone,
          Number(member.amount)
        );
      }
    });

    await Promise.all(updatePromises);

    // Check if all payments are complete
    if (paidCount === totalCount) {
      // Send completion SMS to organizer
      await smsService.sendPaymentCompletion(
        bill.creator.phone,
        Number(bill.amount)
      );
    }
  }

  /**
   * Get bills by creator phone
   */
  async getBillsByCreator(creatorPhone: string): Promise<Bill[]> {
    return await db
      .select()
      .from(bills)
      .leftJoin(users, eq(bills.creator_id, users.id))
      .where(eq(users.phone, creatorPhone));
  }

  /**
   * Get bills by member phone
   */
  async getBillsByMember(memberPhone: string): Promise<Bill[]> {
    return await db
      .select()
      .from(bills)
      .leftJoin(billMembers, eq(bills.id, billMembers.bill_id))
      .where(eq(billMembers.member_phone, memberPhone));
  }
}

export const billService = new BillService();
