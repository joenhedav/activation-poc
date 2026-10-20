/** Cómo se muestra cada evento en la timeline. tone: ok | error | warn | info */
export const EVENT_META = {
  ActivationRequested: { label: 'Activación solicitada', tone: 'info', source: 'activation-api' },
  BillingAccountCreated: { label: 'Cuenta de facturación creada', tone: 'ok', source: 'billing' },
  BillingFailed: { label: 'Falló la facturación', tone: 'error', source: 'billing' },
  BillingAccountCancelled: { label: 'Cuenta de facturación anulada', tone: 'warn', source: 'billing' },
  ProvisioningCompleted: { label: 'Línea aprovisionada', tone: 'ok', source: 'provisioning' },
  ProvisioningFailed: { label: 'Falló el aprovisionamiento', tone: 'error', source: 'provisioning' },
  ActivationCompleted: { label: 'Activación completada', tone: 'ok', source: 'activation-api' },
  ActivationFailed: { label: 'Activación fallida', tone: 'error', source: 'activation-api' },
};

export const STATUS_LABEL = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  ACTIVE: 'Activa',
  FAILED: 'Fallida',
};

export const FAILURE_LABEL = {
  none: 'sin fallo',
  billing: 'fallo forzado en billing',
  provisioning: 'fallo forzado en provisioning',
};
