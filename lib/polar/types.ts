// Polar webhook event types (for reference)
export type PolarWebhookEventType =
  | "checkout.created"
  | "checkout.updated"
  | "order.created"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.active"
  | "subscription.revoked";

export interface PolarWebhookEvent {
  type: PolarWebhookEventType;
  data: Record<string, unknown>;
}

// Metadata types for our checkout sessions
export interface SubscriptionMetadata {
  planId: string;
  userId: string;
  userEmail: string;
}

export interface CreditPurchaseMetadata {
  type: "credits";
  credits: string;
  userId: string;
  userEmail: string;
}
