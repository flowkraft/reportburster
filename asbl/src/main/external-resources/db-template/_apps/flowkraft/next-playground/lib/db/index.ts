import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { payslips, invoices, settings } from "./schema";
import { faker } from "@faker-js/faker";
import { count } from "drizzle-orm";
import path from "path";
import fs from "fs";

// Skip database operations during build time (Next.js sets this)
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Ensure data directory exists (only at runtime)
const dataDir = path.join(process.cwd(), "data");
if (!isBuildTime && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, "app.db");

// Create SQLite connection (use in-memory for build, file for runtime)
const sqlite = isBuildTime 
  ? new Database(":memory:") 
  : new Database(dbPath);

// Enable WAL mode for better performance (only for file-based DB)
if (!isBuildTime) {
  sqlite.pragma("journal_mode = WAL");
}

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS payslips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payslip_number TEXT NOT NULL UNIQUE,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    employee_email TEXT,
    department TEXT,
    pay_period_start TEXT NOT NULL,
    pay_period_end TEXT NOT NULL,
    gross_amount REAL NOT NULL,
    deductions REAL DEFAULT 0,
    net_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_address TEXT,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    paid_at TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Auto-seed function - runs once when DB is empty (skipped during build)
function autoSeed() {
  // Skip seeding during build time
  if (isBuildTime) {
    return;
  }

  try {
    // Check if data already exists
    const [payslipCount] = db.select({ count: count() }).from(payslips).all();
    const [invoiceCount] = db.select({ count: count() }).from(invoices).all();
    
    if ((payslipCount?.count || 0) > 0 || (invoiceCount?.count || 0) > 0) {
      return; // Data exists, skip seeding
    }

    console.log("🌱 Database empty, auto-seeding with sample data...");

    // Seed Payslips
    faker.seed(42);
    const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];

    const payslipData = Array.from({ length: 10 }, (_, i) => {
      const grossAmount = faker.number.int({ min: 3000, max: 8000 });
      const deductions = faker.number.int({ min: 500, max: 1500 });
      const startDate = faker.date.recent({ days: 30 });
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);

      return {
        payslipNumber: `PAY-2026-${String(i + 1).padStart(4, "0")}`,
        employeeId: `EMP-${faker.string.alphanumeric(6).toUpperCase()}`,
        employeeName: faker.person.fullName(),
        employeeEmail: faker.internet.email(),
        department: faker.helpers.arrayElement(departments),
        payPeriodStart: startDate.toISOString().split("T")[0],
        payPeriodEnd: endDate.toISOString().split("T")[0],
        grossAmount,
        deductions,
        netAmount: grossAmount - deductions,
        currency: "USD",
        status: faker.helpers.arrayElement(["draft", "sent", "viewed", "downloaded"] as const),
      };
    });

    db.insert(payslips).values(payslipData).run();
    console.log("✅ Seeded 10 payslips");

    // Seed Invoices
    faker.seed(123);

    const invoiceData = Array.from({ length: 10 }, (_, i) => {
      const issueDate = faker.date.recent({ days: 60 });
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const subtotal = faker.number.int({ min: 500, max: 15000 });
      const taxRate = faker.number.int({ min: 0, max: 20 });
      const taxAmount = subtotal * (taxRate / 100);
      const discount = faker.number.int({ min: 0, max: 500 });

      return {
        invoiceNumber: `INV-2026-${String(i + 1).padStart(4, "0")}`,
        customerId: `CUST-${faker.string.alphanumeric(6).toUpperCase()}`,
        customerName: faker.company.name(),
        customerEmail: faker.internet.email(),
        customerAddress: faker.location.streetAddress({ useFullAddress: true }),
        issueDate: issueDate.toISOString().split("T")[0],
        dueDate: dueDate.toISOString().split("T")[0],
        subtotal,
        taxRate,
        taxAmount,
        discount,
        totalAmount: subtotal + taxAmount - discount,
        currency: "USD",
        status: faker.helpers.arrayElement(["draft", "sent", "paid", "overdue", "cancelled"] as const),
        notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      };
    });

    db.insert(invoices).values(invoiceData).run();
    console.log("✅ Seeded 10 invoices");

    // Seed default settings
    const defaultSettings = [
      { key: "theme.color", value: "reportburster", category: "theme", description: "Color theme name" },
      { key: "theme.mode", value: "light", category: "theme", description: "Theme mode (light/dark)" },
      { key: "company.name", value: "FlowKraft Inc.", category: "company", description: "Company name" },
      { key: "company.email", value: "contact@flowkraft.com", category: "company", description: "Company email" },
      { key: "preferences.currency", value: "USD", category: "preferences", description: "Default currency" },
      { key: "preferences.dateFormat", value: "MM/dd/yyyy", category: "preferences", description: "Date format" },
    ];

    for (const setting of defaultSettings) {
      db.insert(settings).values(setting).run();
    }
    console.log("✅ Seeded default settings");
    console.log("🎉 Auto-seed complete!");
  } catch (error) {
    console.error("Auto-seed error:", error);
  }
}

// Run auto-seed on module load
autoSeed();

// Export schema for convenience
export * from "./schema";
