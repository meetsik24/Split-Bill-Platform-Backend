import { pgTable, serial, varchar, decimal, timestamp, text, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bills table
export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  creator_id: serial('creator_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bill members table
export const billMembers = pgTable('bill_members', {
  id: serial('id').primaryKey(),
  bill_id: serial('bill_id').references(() => bills.id).notNull(),
  member_phone: varchar('member_phone', { length: 20 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  paid_at: timestamp('paid_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bills: many(bills),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  creator: one(users, {
    fields: [bills.creator_id],
    references: [users.id],
  }),
  members: many(billMembers),
}));

export const billMembersRelations = relations(billMembers, ({ one }) => ({
  bill: one(bills, {
    fields: [billMembers.bill_id],
    references: [bills.id],
  }),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type BillMember = typeof billMembers.$inferSelect;
export type NewBillMember = typeof billMembers.$inferInsert;
