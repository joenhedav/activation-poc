#!/bin/bash
# Crea los 4 topics de negocio + sus DLQ: 3 particiones, retención 7 días.
set -e

BOOTSTRAP="kafka:29092"
KT="/opt/kafka/bin/kafka-topics.sh"
RETENTION_MS=604800000   # 7 días

TOPICS=(
  activation.requested
  billing.events
  provisioning.events
  activation.events
)

for t in "${TOPICS[@]}"; do
  for name in "$t" "$t.dlq"; do
    $KT --bootstrap-server "$BOOTSTRAP" --create --if-not-exists \
      --topic "$name" \
      --partitions 3 \
      --replication-factor 1 \
      --config retention.ms=$RETENTION_MS
  done
done

echo "Topics creados:"
$KT --bootstrap-server "$BOOTSTRAP" --list
