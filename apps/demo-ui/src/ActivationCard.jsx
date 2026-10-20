import { EVENT_META, FAILURE_LABEL, STATUS_LABEL } from './events.js';

const time = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour12: false });

function Step({ name, result, cancelled }) {
  const state = result?.status ?? 'WAITING';
  const text = { OK: 'OK', FAILED: 'Falló', WAITING: 'Esperando…' }[state];
  const tone = { OK: 'ok', FAILED: 'error', WAITING: 'pending' }[state];
  return (
    <span className={`pill ${tone}`}>
      {name}: {text}
      {cancelled && <em> · anulada</em>}
    </span>
  );
}

export default function ActivationCard({ activation }) {
  const { _id, customerId, planId, status, simulateFailure, steps = {}, history = [] } = activation;
  const billingCancelled = history.some((h) => h.eventType === 'BillingAccountCancelled');

  return (
    <article className={`card activation ${status.toLowerCase()}`}>
      <div className="activation-head">
        <div>
          <h3>{_id}</h3>
          <p className="meta">
            {customerId} · {planId}
            {simulateFailure && simulateFailure !== 'none' && (
              <span className="chip">{FAILURE_LABEL[simulateFailure]}</span>
            )}
          </p>
        </div>
        <span className={`badge ${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>
      </div>

      <div className="steps">
        <Step name="Billing" result={steps.billing} cancelled={billingCancelled} />
        <Step name="Provisioning" result={steps.provisioning} />
      </div>

      <ol className="timeline">
        {history.map((entry, index) => {
          const meta = EVENT_META[entry.eventType] ?? {
            label: entry.eventType,
            tone: 'info',
            source: '',
          };
          return (
            <li key={`${entry.eventType}-${index}`} className={meta.tone}>
              <span className="dot" />
              <div>
                <strong>{meta.label}</strong>
                <code>{entry.eventType}</code>
              </div>
              <span className="when">
                {meta.source && <em>{meta.source}</em>} {time(entry.at)}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
