import { randomUUID } from 'crypto';
import { EVENT_VERSION, EventEnvelope } from './event-envelope';
import { SimulateFailure } from './activation-status';
import { TOPICS, Topic } from './topics';

// ───────────── Payloads ─────────────

export interface ActivationRequestedPayload {
  planId: string;
  channel: string;
  simulateFailure: SimulateFailure;
}

export interface BillingAccountCreatedPayload {
  billingAccountId: string;
}

export interface BillingFailedPayload {
  reason: string;
}

export interface BillingAccountCancelledPayload {
  billingAccountId?: string;
  reason: string;
}

export interface ProvisioningCompletedPayload {
  orderId: string;
}

export interface ProvisioningFailedPayload {
  reason: string;
}

export interface ActivationCompletedPayload {
  planId: string;
}

export interface ActivationFailedPayload {
  reason: string;
  failedStep: 'billing' | 'provisioning';
}

// ───────────── Mapa evento → payload ─────────────

export interface EventPayloads {
  ActivationRequested: ActivationRequestedPayload;
  BillingAccountCreated: BillingAccountCreatedPayload;
  BillingFailed: BillingFailedPayload;
  BillingAccountCancelled: BillingAccountCancelledPayload;
  ProvisioningCompleted: ProvisioningCompletedPayload;
  ProvisioningFailed: ProvisioningFailedPayload;
  ActivationCompleted: ActivationCompletedPayload;
  ActivationFailed: ActivationFailedPayload;
}

export type EventType = keyof EventPayloads;

/** Unión de todos los eventos posibles, discriminada por eventType. */
export type DomainEvent<T extends EventType = EventType> = {
  [K in T]: EventEnvelope<K, EventPayloads[K]>;
}[T];

/** En qué topic se publica cada evento. */
export const EVENT_TOPIC: Record<EventType, Topic> = {
  ActivationRequested: TOPICS.ACTIVATION_REQUESTED,
  BillingAccountCreated: TOPICS.BILLING_EVENTS,
  BillingFailed: TOPICS.BILLING_EVENTS,
  BillingAccountCancelled: TOPICS.BILLING_EVENTS,
  ProvisioningCompleted: TOPICS.PROVISIONING_EVENTS,
  ProvisioningFailed: TOPICS.PROVISIONING_EVENTS,
  ActivationCompleted: TOPICS.ACTIVATION_EVENTS,
  ActivationFailed: TOPICS.ACTIVATION_EVENTS,
};

// ───────────── Fábrica ─────────────

export interface CreateEventArgs<T extends EventType> {
  eventType: T;
  correlationId: string;
  customerId: string;
  source: string;
  payload: EventPayloads[T];
}

/** Arma un evento completo con eventId, versión y fecha. */
export function createEvent<T extends EventType>(
  args: CreateEventArgs<T>,
): EventEnvelope<T, EventPayloads[T]> {
  return {
    eventId: randomUUID(),
    eventType: args.eventType,
    version: EVENT_VERSION,
    occurredAt: new Date().toISOString(),
    correlationId: args.correlationId,
    customerId: args.customerId,
    source: args.source,
    payload: args.payload,
  };
}
