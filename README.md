# activation-poc

POC de **activación de servicios con Kafka**: un cliente contrata un plan desde una UI en React y un único evento en Kafka dispara facturación, aprovisionamiento, notificación y registro en CRM, sin que ningún servicio llame directamente a otro.

Sistemas Distribuidos · Ingeniería en Sistemas de Información · FCyT

## Requisitos

- Docker con Docker Compose.
- Para desarrollo sin contenedores: Node.js 20 o superior y npm.

## Arranque rápido

```bash
docker compose up -d --build
docker compose ps
```

La primera vez tarda unos minutos (construye las imágenes). Cuando `kafka` y `mongo` figuren como `healthy`, abrí la UI.

| Qué | URL / puerto |
|---|---|
| Demo UI (formulario y timeline en vivo) | http://localhost:5173 |
| API REST + WebSocket (`activation-api`) | http://localhost:3000 |
| Kafka UI (topics, mensajes, consumer groups) | http://localhost:8080 |
| Mailhog (emails simulados) | http://localhost:8025 |
| Kafka (desde el host) | `localhost:9092` |
| MongoDB (desde el host) | `localhost:27017` |

Para apagar todo y borrar los datos (Kafka y Mongo):

```bash
docker compose --profile loyalty down -v
```

## Servicios

| Servicio | Qué hace |
|---|---|
| `activation-api` | Único punto de entrada: `POST /activations`, `GET /activations`, `GET /activations/:id` y WebSocket. Agrega los resultados de billing y provisioning y decide el estado final. |
| `billing-service` | Crea la cuenta de facturación simulada; la anula si la activación falla (compensación). |
| `provisioning-service` | Simula el aprovisionamiento (1 a 3 s). |
| `notification-service` | Envía el email de bienvenida o de error a Mailhog. |
| `crm-analytics-service` | Consume todos los topics y guarda cada evento en `event_log`. |
| `loyalty-service` | Consumidor nuevo del escenario 5. Suma puntos por activación completada. Perfil `loyalty`. |
| `demo-ui` | React + Vite. Formulario "Contratar plan" y timeline por WebSocket. |

`loyalty-service` no arranca con `docker compose up`. Se levanta aparte:

```bash
docker compose --profile loyalty up -d loyalty-service
```

## Usar la API sin la UI

```bash
curl -X POST localhost:3000/activations \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"C-1234","planId":"Plan Digital","simulateFailure":"none"}'
```

`simulateFailure` acepta `none`, `billing` o `provisioning`. La respuesta es `202 Accepted` con el `activationId` y el estado `PENDING`. Para consultarla:

```bash
curl localhost:3000/activations/<activationId>
```

## Desarrollo sin contenedores para los servicios

Se puede dejar la infraestructura en Docker y correr cada servicio con Nest:

```bash
docker compose up -d kafka kafka-init kafka-ui mongo mailhog
npm install
npx nest start activation-api        # una terminal por servicio
npx nest start billing-service
npx nest start provisioning-service
npx nest start notification-service
cd apps/demo-ui && npm install && npm run dev
```

No conviene tener el mismo servicio corriendo en Docker y a mano a la vez: se sumaría al mismo consumer group y chocaría con el puerto 3000.

## Estructura

```
activation-poc/
├── apps/
│   ├── activation-api/          REST + WebSocket + agregador de la saga
│   ├── billing-service/
│   ├── provisioning-service/
│   ├── notification-service/
│   ├── crm-analytics-service/
│   ├── loyalty-service/
│   └── demo-ui/                 React + Vite + socket.io-client
├── libs/
│   ├── contracts/               tipos de eventos, sobre común, nombres de topics
│   └── kafka-toolkit/           publicador, reintentos y DLQ
├── docker/
│   ├── Dockerfile.nest          imagen única para las apps NestJS
│   └── create-topics.sh         crea los topics (3 particiones, retención de 7 días)
├── docker-compose.yml
└── docs/
    ├── architecture.md
    └── demo-script.md
```

## Más información

- Arquitectura, decisiones técnicas y estado de implementación: [`docs/architecture.md`](docs/architecture.md)
- Guion de la demo con los cinco escenarios: [`docs/demo-script.md`](docs/demo-script.md)
