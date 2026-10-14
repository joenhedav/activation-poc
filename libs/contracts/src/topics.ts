/** Nombres de topics. Convención: dominio.tipo */
export const TOPICS = {
  ACTIVATION_REQUESTED: 'activation.requested',
  BILLING_EVENTS: 'billing.events',
  PROVISIONING_EVENTS: 'provisioning.events',
  ACTIVATION_EVENTS: 'activation.events',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

/** Topic de mensajes muertos (DLQ) de un topic de negocio. */
export const dlqOf = (topic: Topic): string => `${topic}.dlq`;
