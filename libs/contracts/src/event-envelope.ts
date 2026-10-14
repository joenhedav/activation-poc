/** Versión actual de los contratos. Cambios incompatibles suben este número. */
export const EVENT_VERSION = 1;

/** Sobre común a todos los eventos; el payload cambia según el eventType. */
export interface EventEnvelope<TType extends string = string, TPayload = unknown> {
  /** Identificador único; base de la idempotencia. */
  eventId: string;
  eventType: TType;
  version: number;
  /** ISO 8601 */
  occurredAt: string;
  /** Es el activationId: agrupa todos los eventos de una activación. */
  correlationId: string;
  /** También es la clave del mensaje en Kafka (garantiza orden por cliente). */
  customerId: string;
  /** Servicio que publicó el evento. */
  source: string;
  payload: TPayload;
}
