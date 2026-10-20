import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import ActivationCard from './ActivationCard.jsx';
import ActivationForm from './ActivationForm.jsx';
import { API_URL, KAFKA_UI_URL, MAILHOG_URL } from './config.js';

// Se queda con la versión más nueva de cada activación (evita pisar con un dato viejo).
function merge(prev, incoming) {
  const current = prev[incoming._id];
  if (current && new Date(current.updatedAt) > new Date(incoming.updatedAt)) return prev;
  return { ...prev, [incoming._id]: incoming };
}

export default function App() {
  const [activations, setActivations] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_URL);

    const loadRecent = () =>
      fetch(`${API_URL}/activations`)
        .then((res) => res.json())
        .then((list) => setActivations((prev) => list.reduce(merge, prev)))
        .catch(() => {});

    socket.on('connect', () => {
      setConnected(true);
      loadRecent(); // al (re)conectar, se ponen al día las activaciones recientes
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('activation.updated', (activation) =>
      setActivations((prev) => merge(prev, activation)),
    );

    return () => socket.disconnect();
  }, []);

  const list = useMemo(
    () =>
      Object.values(activations).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      ),
    [activations],
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Activación de servicios</h1>
          <p className="subtitle">Un solo evento en Kafka dispara toda la activación</p>
        </div>
        <div className="header-right">
          <span className={`live ${connected ? 'on' : 'off'}`}>
            <span className="live-dot" />
            {connected ? 'En vivo' : 'Sin conexión'}
          </span>
          <a href={KAFKA_UI_URL} target="_blank" rel="noreferrer">Kafka UI</a>
          <a href={MAILHOG_URL} target="_blank" rel="noreferrer">Mailhog</a>
        </div>
      </header>

      <main className="layout">
        <aside>
          <ActivationForm />
        </aside>

        <section className="list">
          <h2>Activaciones <span className="count">{list.length}</span></h2>
          {list.length === 0 && (
            <p className="empty">Todavía no hay activaciones. Contratá un plan para empezar.</p>
          )}
          {list.map((activation) => (
            <ActivationCard key={activation._id} activation={activation} />
          ))}
        </section>
      </main>
    </div>
  );
}
