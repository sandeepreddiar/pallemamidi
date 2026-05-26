import { pgTable, uuid, varchar, integer, timestamp, numeric, text, pgEnum, index, boolean } from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'PENDING_VERIFICATION',
  'PAID',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED'
]);

export const varietyStatusEnum = pgEnum('variety_status', [
  'AVAILABLE',
  'OUT_OF_SEASON',
  'SOLD_OUT',
  'PREBOOKING'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'UPI',
  'COD',
]);

export const varieties = pgTable('varieties', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  description: text('description').notNull(),
  image: varchar('image', { length: 500 }).notNull(),
  pricePerKg: numeric('price_per_kg', { precision: 10, scale: 2 }).notNull(),
  allowedWeights: varchar('allowed_weights', { length: 80 }).notNull().default('1,5,10'),
  status: varietyStatusEnum('status').default('AVAILABLE').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),

  customerName: varchar('customer_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  rtcDepotCode: varchar('rtc_depot_code', { length: 40 }),
  rtcDepotName: varchar('rtc_depot_name', { length: 200 }),
  rtcLandmark: text('rtc_landmark').notNull(),
  customerNotes: text('customer_notes'),

  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  packingFee: numeric('packing_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  status: orderStatusEnum('status').default('PENDING').notNull(),

  paymentMethod: paymentMethodEnum('payment_method').default('UPI').notNull(),
  utr: varchar('utr', { length: 32 }),
  utrSubmittedAt: timestamp('utr_submitted_at'),
  paidAt: timestamp('paid_at'),
  dispatchedAt: timestamp('dispatched_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  adminNotes: text('admin_notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('orders_phone_idx').on(table.phoneNumber),
  index('orders_status_idx').on(table.status),
  index('orders_utr_idx').on(table.utr),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  variety: varchar('variety', { length: 80 }).notNull(),
  quantityKg: integer('quantity_kg').notNull(),
  priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
});

export type Variety = typeof varieties.$inferSelect;
export type NewVariety = typeof varieties.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatus = Order['status'];
export type VarietyStatus = Variety['status'];

export const checkoutEvents = pgTable('checkout_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  cartJson: text('cart_json'),
  cartHash: varchar('cart_hash', { length: 100 }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'CHECKOUT_STARTED' | 'PAYMENT_INTENT' | 'PAYMENT_SUBMITTED'
  emailSent: boolean('email_sent').default(false).notNull(),
  ipAddress: varchar('ip_address', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('checkout_events_session_idx').on(table.sessionId),
  index('checkout_events_phone_idx').on(table.phone),
]);

export type CheckoutEvent = typeof checkoutEvents.$inferSelect;
export type NewCheckoutEvent = typeof checkoutEvents.$inferInsert;

