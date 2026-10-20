import { useState } from 'react';
import { API_URL } from './config.js';

const PLANS = ['Plan Digital', 'Plan Premium', 'Plan Familiar'];

const FAILURES = [
  { value: 'none', label: 'Ninguno', hint: 'Camino feliz' },
  { value: 'billing', label: 'Facturación', hint: 'Falla billing' },
  { value: 'provisioning', label: 'Aprovisionamiento', hint: 'Falla y se anula la cuenta' },
];

export default function ActivationForm() {
  const [customerId, setCustomerId] = useState('C-1234');
  const [planId, setPlanId] = useState(PLANS[0]);
  const [simulateFailure, setSimulateFailure] = useState('none');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/activations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerId.trim(), planId, simulateFailure }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        throw new Error(detail || `Error ${res.status}`);
      }
      setMessage({ type: 'ok', text: `202 Accepted · ${body.activationId} · ${body.status}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Contratar plan</h2>

      <label>
        Cliente
        <input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="C-1234"
          required
        />
      </label>

      <label>
        Plan
        <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {PLANS.map((plan) => (
            <option key={plan}>{plan}</option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend>Forzar un fallo en</legend>
        {FAILURES.map((failure) => (
          <label
            key={failure.value}
            className={`radio ${simulateFailure === failure.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="failure"
              value={failure.value}
              checked={simulateFailure === failure.value}
              onChange={() => setSimulateFailure(failure.value)}
            />
            <span>
              <strong>{failure.label}</strong>
              <small>{failure.hint}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <button type="submit" disabled={sending || !customerId.trim()}>
        {sending ? 'Enviando…' : 'Contratar plan'}
      </button>

      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </form>
  );
}
