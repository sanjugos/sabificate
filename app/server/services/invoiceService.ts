import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { PAYMENT } from '../../contracts/shared/constants.js';
import type { Invoice } from '../../contracts/api/payments.js';

// ── Invoice creation ───────────────────────────────────────────────────────

export interface CreateInvoiceParams {
  orgId: string;
  planId: string;
  seatCount: number;
  billingContactEmail: string;
}

export async function createInvoice(
  params: CreateInvoiceParams,
): Promise<Invoice> {
  const { orgId, planId, seatCount, billingContactEmail } = params;

  // Look up the plan price
  const planResult = await query(
    `SELECT price_ngn, name, billing_cycle FROM ${TABLES.SUBSCRIPTION_PLANS} WHERE id = $1`,
    [planId],
  );
  const plan = planResult.rows[0] as
    | { price_ngn: number; name: string; billing_cycle: string }
    | undefined;

  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }

  // Calculate totals
  const subtotal = plan.price_ngn * seatCount;
  const vat = Math.round(subtotal * PAYMENT.VAT_RATE * 100) / 100;
  const total = subtotal + vat;

  // Generate invoice number: SAB-YYYY-NNNN
  const invoiceNumber = await generateInvoiceNumber();

  // Due date: 30 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const result = await query(
    `INSERT INTO ${TABLES.INVOICES}
       (org_id, invoice_number, subtotal_ngn, vat_ngn, total_ngn, status, due_date, billing_contact_email, plan_id, seat_count)
     VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9)
     RETURNING id, invoice_number, org_id, subtotal_ngn, vat_ngn, total_ngn, status, due_date, pdf_url, created_at`,
    [orgId, invoiceNumber, subtotal, vat, total, dueDate.toISOString(), billingContactEmail, planId, seatCount],
  );

  return result.rows[0] as Invoice;
}

// ── PDF generation stub ────────────────────────────────────────────────────

export async function generatePDF(invoiceId: string): Promise<string> {
  // Load invoice details
  const result = await query(
    `SELECT i.*, o.name AS org_name
     FROM ${TABLES.INVOICES} i
     JOIN ${TABLES.ORGANIZATIONS} o ON o.id = i.org_id
     WHERE i.id = $1`,
    [invoiceId],
  );

  const invoice = result.rows[0] as
    | (Invoice & { org_name: string; billing_contact_email: string; seat_count: number })
    | undefined;

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // Generate HTML representation (in production, convert to PDF via puppeteer/wkhtmltopdf)
  const html = buildInvoiceHTML(invoice);

  // For now, return the HTML string. A production implementation would:
  // 1. Convert HTML to PDF buffer
  // 2. Upload to object storage
  // 3. Return the signed URL
  const pdfUrl = `/api/v1/admin/invoices/${invoiceId}/pdf`;

  await query(
    `UPDATE ${TABLES.INVOICES} SET pdf_url = $1, updated_at = NOW() WHERE id = $2`,
    [pdfUrl, invoiceId],
  );

  // Store the rendered HTML for serving (in a real system this would be a PDF blob)
  await query(
    `UPDATE ${TABLES.INVOICES} SET rendered_html = $1 WHERE id = $2`,
    [html, invoiceId],
  );

  return pdfUrl;
}

// ── Mark invoice as paid ───────────────────────────────────────────────────

export async function markPaid(invoiceId: string): Promise<void> {
  const result = await query(
    `UPDATE ${TABLES.INVOICES}
     SET status = 'paid', updated_at = NOW()
     WHERE id = $1
     RETURNING org_id, plan_id, seat_count`,
    [invoiceId],
  );

  const invoice = result.rows[0] as
    | { org_id: string; plan_id: string; seat_count: number }
    | undefined;

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // Allocate seats for the organization
  await allocateSeats(invoice.org_id, invoice.plan_id, invoice.seat_count);
}

// ── List invoices for an org ───────────────────────────────────────────────

export async function listInvoices(
  orgId: string,
  page: number,
  limit: number,
): Promise<{ invoices: Invoice[]; total: number }> {
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM ${TABLES.INVOICES} WHERE org_id = $1`,
    [orgId],
  );
  const total = parseInt(countResult.rows[0].total as string, 10);

  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT id, invoice_number, org_id, subtotal_ngn, vat_ngn, total_ngn, status, due_date, pdf_url, created_at
     FROM ${TABLES.INVOICES}
     WHERE org_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [orgId, limit, offset],
  );

  return { invoices: result.rows as Invoice[], total };
}

// ── Get rendered HTML for PDF download ─────────────────────────────────────

export async function getInvoiceHTML(invoiceId: string): Promise<string | null> {
  const result = await query(
    `SELECT rendered_html FROM ${TABLES.INVOICES} WHERE id = $1`,
    [invoiceId],
  );

  return (result.rows[0]?.rendered_html as string) ?? null;
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) AS cnt FROM ${TABLES.INVOICES} WHERE invoice_number LIKE $1`,
    [`SAB-${year}-%`],
  );
  const count = parseInt(result.rows[0].cnt as string, 10) + 1;
  return `SAB-${year}-${String(count).padStart(4, '0')}`;
}

async function allocateSeats(
  orgId: string,
  planId: string,
  seatCount: number,
): Promise<void> {
  // Upsert seat allocation
  await query(
    `INSERT INTO ${TABLES.SEAT_ALLOCATIONS} (organization_id, plan_id, total_seats, used_seats)
     VALUES ($1, $2, $3, 0)
     ON CONFLICT (organization_id) DO UPDATE SET
       total_seats = ${TABLES.SEAT_ALLOCATIONS}.total_seats + EXCLUDED.total_seats,
       updated_at = NOW()`,
    [orgId, planId, seatCount],
  );

  // Activate/update org subscription
  await query(
    `INSERT INTO ${TABLES.SUBSCRIPTIONS} (organization_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days')
     ON CONFLICT (organization_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = 'active',
       current_period_start = NOW(),
       current_period_end = NOW() + INTERVAL '30 days',
       updated_at = NOW()`,
    [orgId, planId],
  );
}

function buildInvoiceHTML(
  invoice: Invoice & { org_name: string; billing_contact_email: string; seat_count: number },
): string {
  const formatNGN = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { font-size: 24px; font-weight: bold; color: #1a56db; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { margin: 0; color: #1a56db; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { width: 45%; }
    .party h3 { margin-bottom: 8px; color: #666; font-size: 12px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { text-align: right; }
    .totals td { border: none; padding: 6px 12px; }
    .totals .total-row { font-size: 18px; font-weight: bold; color: #1a56db; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">SABIficate</div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p>${invoice.invoice_number}</p>
      <p>Date: ${new Date(invoice.created_at).toLocaleDateString('en-NG')}</p>
      <p>Due: ${new Date(invoice.due_date).toLocaleDateString('en-NG')}</p>
      <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p><strong>SABIficate Ltd</strong></p>
      <p>Lagos, Nigeria</p>
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <p><strong>${invoice.org_name}</strong></p>
      <p>${invoice.billing_contact_email}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Subscription Seats</td>
        <td>${invoice.seat_count}</td>
        <td>${formatNGN(invoice.subtotal_ngn / invoice.seat_count)}</td>
        <td>${formatNGN(invoice.subtotal_ngn)}</td>
      </tr>
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal:</td><td>${formatNGN(invoice.subtotal_ngn)}</td></tr>
    <tr><td>VAT (7.5%):</td><td>${formatNGN(invoice.vat_ngn)}</td></tr>
    <tr class="total-row"><td>Total:</td><td>${formatNGN(invoice.total_ngn)}</td></tr>
  </table>

  <div class="footer">
    <p>Payment is due within 30 days of invoice date.</p>
    <p>For questions, contact billing@sabificate.com</p>
  </div>
</body>
</html>`;
}
