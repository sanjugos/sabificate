export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'individual' | 'corporate';
  price_ngn: number;
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  max_courses: number | null;
  paystack_plan_code: string;
}

export interface InitializePaymentRequest {
  plan_id: string;
  payment_type: 'subscription' | 'invoice';
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackWebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

export interface PaymentFailedEvent {
  user_id: string;
  transaction_id: string;
  attempt_number: number;
  next_retry_at: string | null;
}

export interface InvoiceRequest {
  org_id: string;
  plan_id: string;
  seat_count: number;
  billing_contact_email: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  org_id: string;
  subtotal_ngn: number;
  vat_ngn: number;
  total_ngn: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  pdf_url: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  org_id: string | null;
  amount_ngn: number;
  currency: 'NGN';
  payment_method: 'card' | 'bank_transfer' | 'ussd';
  gateway: 'paystack';
  gateway_reference: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  metadata: PaymentMetadata;
  created_at: string;
}

export interface PaymentMetadata {
  subscription_plan_id?: string;
  invoice_number?: string;
  promo_code_id?: string;
  billing_cycle?: string;
}

export interface DunningAttempt {
  id: string;
  transaction_id: string;
  user_id: string;
  attempt_number: number;
  channel: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'delivered' | 'failed';
  sent_at: string;
  next_attempt_at: string | null;
}
