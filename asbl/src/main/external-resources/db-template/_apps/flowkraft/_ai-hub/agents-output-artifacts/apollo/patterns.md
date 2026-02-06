# Apollo — Patterns & Notes

## Next.js App Router Patterns Used

### Route Groups for Layouts
```
app/
  (main)/        ← public pages: Navbar + Footer
    layout.tsx
    page.tsx
  (admin)/       ← admin panel: Sidebar + Header
    layout.tsx
    admin/
      page.tsx   ← dashboard
      invoices/  ← invoice CRUD
      payslips/  ← payslip CRUD
      settings/  ← config
```
Route groups `(main)` and `(admin)` share the root layout but have different
navigation components. No URL prefix — `/admin/invoices` not `/(admin)/admin/invoices`.

### API Route Pattern
Each entity has two route files:
- `app/api/payslips/route.ts` — GET (list with filters) + POST (create)
- `app/api/payslips/[id]/route.ts` — GET (single) + PUT (update) + DELETE

All return `NextResponse.json()`. Errors return appropriate HTTP status codes.

### Drizzle ORM Usage
```typescript
// List with filter
const results = await db.select().from(payslips)
  .where(and(
    status ? eq(payslips.status, status) : undefined,
    search ? or(
      like(payslips.employeeName, `%${search}%`),
      like(payslips.payslipNumber, `%${search}%`)
    ) : undefined
  ))
  .orderBy(desc(payslips.createdAt));
```

### Auto-Seed on First Access
```typescript
// lib/db/index.ts
const count = await db.select({ count: sql`count(*)` }).from(payslips);
if (count[0].count === 0) {
  await seedDatabase(db);
}
```
Seed runs once, creates 10 sample records with faker data.

## Component Patterns

### Status Badge
```tsx
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  downloaded: 'bg-green-100 text-green-700',
};
<Badge className={statusColors[payslip.status]}>{payslip.status}</Badge>
```

### Form with Auto-Calculation
```tsx
const handleAmountChange = () => {
  const net = grossAmount - deductions;
  setNetAmount(Math.max(0, net));
};
```
`useEffect` watches grossAmount and deductions, recalculates netAmount.

### Settings from Database (not localStorage)
All settings stored in SQLite via `/api/settings`. The `use-settings` hook fetches
on mount and caches in React state. Theme changes trigger a PUT to persist.

## Stack Summary
| Layer      | Technology               |
|------------|--------------------------|
| Framework  | Next.js 15 (App Router)  |
| Language   | TypeScript               |
| Styling    | Tailwind CSS + shadcn/ui |
| ORM        | Drizzle (SQLite)         |
| Payments   | Stripe + PayPal          |
| Auth       | NextAuth.js              |
| Icons      | Lucide React             |
