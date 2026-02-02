import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Payslip statuses
export const payslipStatuses = ["draft", "sent", "viewed", "downloaded"] as const;
export type PayslipStatus = (typeof payslipStatuses)[number];

// Invoice statuses
export const invoiceStatuses = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

// Payslips table
export const payslips = sqliteTable("payslips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  payslipNumber: text("payslip_number").notNull().unique(),
  employeeId: text("employee_id").notNull(),
  employeeName: text("employee_name").notNull(),
  employeeEmail: text("employee_email"),
  department: text("department"),
  payPeriodStart: text("pay_period_start").notNull(),
  payPeriodEnd: text("pay_period_end").notNull(),
  grossAmount: real("gross_amount").notNull(),
  deductions: real("deductions").default(0),
  netAmount: real("net_amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status", { enum: payslipStatuses }).default("draft").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Payment methods
export const paymentMethods = ["stripe", "paypal", "bank_transfer", "cash", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

// Invoices table
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  subtotal: real("subtotal").notNull(),
  taxRate: real("tax_rate").default(0),
  taxAmount: real("tax_amount").default(0),
  discount: real("discount").default(0),
  totalAmount: real("total_amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status", { enum: invoiceStatuses }).default("draft").notNull(),
  notes: text("notes"),
  // Payment fields
  paidAt: text("paid_at"),
  paymentMethod: text("payment_method", { enum: paymentMethods }),
  paymentReference: text("payment_reference"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Type inference helpers
export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
