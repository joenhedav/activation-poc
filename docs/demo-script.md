# Guion de la demo

Cinco escenarios, cada uno muestra un concepto de Kafka. Pantalla dividida: **Demo UI a la izquierda, Kafka UI a la derecha**. Duración estimada: 15 minutos.

## Preparación

1. Levantar todo desde cero y esperar a que esté listo:

   ```bash
   docker compose --profile loyalty down -v
   docker compose up -d --build
   docker compose ps
   ```

   Tienen que estar `Up` los nueve servicios (con `kafka` y `mongo` en `healthy`) y `kafka-init` en `Exited (0)`.

2. Abrir tres pestañas: UI (http://localhost:5173), Kafka UI (http://localhost:8080) y Mailhog (http://localhost:8025).
3. En la UI debe decir **En vivo**. En Mailhog, borrar los mensajes con **Delete all messages**.

## Escenario 1 · Camino feliz (2 min)

**Concepto:** fan-out. Un evento, varias reacciones.

- **Qué se hace:** en la UI, "Forzar un fallo en: Ninguno" y **Contratar plan**.
- **Qué se ve:**
  - La tarjeta pasa de *Pendiente* a *En curso* y a *Activa*, con 4 eventos en verde: `ActivationRequested`, `BillingAccountCreated`, `ProvisioningCompleted` y `ActivationCompleted`.
  - Billing responde al instante y provisioning tarda 1 a 3 segundos: trabajan en paralelo.
  - En Mailhog llega el email de bienvenida.
  - En Kafka UI, `activation.requested` tiene un solo mensaje, y de ahí salen las reacciones.
- **Qué decir:** un solo evento dispara facturación, aprovisionamiento, notificación y CRM, y nadie llamó a nadie.

## Escenario 2 · Fallo y compensación (2 min)

**Concepto:** saga sin llamadas directas.

- **Qué se hace:** "Forzar un fallo en: Aprovisionamiento" y **Contratar plan**.
- **Qué se ve:**
  - `ProvisioningFailed`, `ActivationFailed` y `BillingAccountCancelled` (este último en naranja).
  - La tarjeta termina *Fallida*, con billing "OK · anulada".
  - En Mailhog llega el email de error.
- **Qué decir:** billing ya había creado la cuenta; al enterarse del fallo por el evento, la anuló solo. No hay un orquestador que le dé órdenes.

## Escenario 3 · Servicio caído (3 min)

**Concepto:** offsets. Nadie pierde mensajes.

- **Qué se hace:**

  ```bash
  docker compose stop notification-service
  ```

  Contratar 3 planes desde la UI. En Kafka UI, **Consumers → `notification-svc-server`**: el lag es 3. Después:

  ```bash
  docker compose start notification-service
  ```

- **Qué se ve:** al volver, llegan los 3 emails a Mailhog y el lag baja a 0.
- **Qué decir:** Kafka guarda los mensajes y recuerda hasta dónde leyó cada consumer group. El servicio caído retomó exactamente donde quedó.

## Escenario 4 · Escalar (3 min)

**Concepto:** consumer groups y particiones.

- **Qué se hace:**

  ```bash
  docker compose up -d --scale billing-service=2
  ```

  Contratar varios planes con **clientes distintos** (`C-1`, `C-2`, `C-3`...). Con un solo cliente todo cae en la misma partición y no se nota el reparto. Para ver quién procesa cada uno:

  ```bash
  docker compose logs -f billing-service
  ```

- **Qué se ve:** en Kafka UI, `billing-svc-server` tiene 2 miembros con las particiones repartidas. Hay una pausa de unos segundos mientras Kafka rebalancea; conviene explicarla como parte de la demo.
- **Cierre:** volver a una instancia con `docker compose up -d --scale billing-service=1`.
- **Qué decir:** las 3 particiones se reparten entre las instancias del mismo grupo. Es la forma de escalar un consumidor sin cambiar código.

## Escenario 5 · Nuevo consumidor (3 min)

**Concepto:** replay del log. Es el que cierra la demo.

- **Qué se hace:** con algunas activaciones ya hechas, levantar un servicio que no existía:

  ```bash
  docker compose --profile loyalty up -d loyalty-service
  docker compose logs -f loyalty-service
  ```

- **Qué se ve:** loyalty procesa todo el historial de `activation.events` de una vez (`⭐ ... suma 100 puntos` por cada activación completada, con el total por cliente) y después sigue en vivo. Ningún otro servicio se tocó ni se reinició.
- **Qué decir:** con APIs directas, un servicio nuevo no puede enterarse de lo que pasó antes. Con el log de Kafka, sí.
- **Repetirlo:** el grupo recuerda hasta dónde leyó, así que para volver a mostrarlo hay que reiniciar su estado:

  ```bash
  docker compose --profile loyalty rm -sf loyalty-service
  docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server kafka:29092 --delete --group loyalty-server
  docker exec mongo mongosh loyalty --quiet --eval 'db.dropDatabase()'
  ```

## Extra · Mensaje inválido y DLQ (opcional, 2 min)

**Concepto:** un mensaje roto no frena el flujo.

- **Mensaje inválido** (texto suelto):

  ```bash
  echo 'esto no es un evento' | docker exec -i kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server kafka:29092 --topic activation.requested
  ```

  En Kafka UI, **Topics → `activation.requested.dlq` → Messages**: hay un mensaje por servicio que escucha el topic, con los headers `dlq-service`, `dlq-error` y `dlq-attempts`. Contratar un plan normal: sigue funcionando.

- **Error técnico con reintentos** (evento con la forma correcta pero sin `planId`):

  ```bash
  echo '{"eventId":"test-poison-1","eventType":"ActivationRequested","version":1,"occurredAt":"2026-10-22T00:00:00Z","correlationId":"act-poison","customerId":"C-POISON","source":"manual","payload":{}}' | docker exec -i kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server kafka:29092 --topic activation.requested
  docker compose logs -f provisioning-service
  ```

  Se ven tres reintentos (1 s, 2 s y 4 s) y después el envío a la DLQ, con `dlq-attempts` igual a 4. Tarda unos 15 segundos.

## Cronograma sugerido

| Bloque | Minutos |
|---|---|
| Presentación de la arquitectura (diagrama de `architecture.md`) | 2 |
| Escenario 1 | 2 |
| Escenario 2 | 2 |
| Escenario 3 | 3 |
| Escenario 4 | 3 |
| Escenario 5 | 3 |
| **Total** | **15** |

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| La UI dice "Sin conexión" | `docker compose ps`: ¿`activation-api` está `Up`? Ver `docker compose logs --tail 30 activation-api`. |
| La activación queda en *Pendiente* | Billing o provisioning caídos, o Kafka sin terminar de arrancar. Mirar `docker compose ps` y los logs del servicio. |
| No llegan emails | Ver que `notification-service` esté `Up` y mirar el lag de `notification-svc-server` en Kafka UI. |
| El rebalanceo del escenario 4 tarda | Es normal: unos segundos. Explicarlo como parte de la demo. |
| Nada funciona en vivo | Usar el video de respaldo de los 5 escenarios. |
