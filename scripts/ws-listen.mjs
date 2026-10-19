// Escucha el WebSocket de activation-api y muestra cada actualización.
// Uso: node scripts/ws-listen.mjs
import { io } from 'socket.io-client';

const socket = io(process.env.API_URL ?? 'http://localhost:3000');

socket.on('connect', () => console.log(`Conectado (${socket.id}). Esperando actualizaciones...`));
socket.on('connect_error', (err) => console.log(`Error de conexión: ${err.message}`));
socket.on('activation.updated', (a) => {
  const events = a.history.map((h) => h.eventType).join(' > ');
  console.log(`${a._id}  ${a.status.padEnd(11)}  ${events}`);
});
