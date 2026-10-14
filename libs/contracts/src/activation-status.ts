/** Estados de la activación (sección 06 del documento). */
export const ACTIVATION_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  ACTIVE: 'ACTIVE',
  FAILED: 'FAILED',
} as const;

export type ActivationStatus =
  (typeof ACTIVATION_STATUS)[keyof typeof ACTIVATION_STATUS];

/** Modo de fallo forzado desde la UI (solo para la demo). */
export type SimulateFailure = 'none' | 'billing' | 'provisioning';
