import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

/**
 * Empuja a la UI cada cambio de una activación (RF-08).
 * Comparte el puerto HTTP de la API: la UI se conecta a http://localhost:3000.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class ActivationGateway {
  @WebSocketServer()
  private server: Server;

  /** Envía el estado completo de la activación (estado, pasos e historial). */
  emitUpdate(activation: unknown): void {
    this.server?.emit('activation.updated', activation);
  }
}
