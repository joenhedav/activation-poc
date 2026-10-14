import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KAFKA_CLIENT, getBrokers } from './kafka.config';
import { KafkaPublisher } from './kafka-publisher.service';

@Module({})
export class KafkaToolkitModule {
  /** Importar en el AppModule de cada servicio que PUBLICA eventos. */
  static forRoot(options: { clientId: string }): DynamicModule {
    return {
      module: KafkaToolkitModule,
      imports: [
        ClientsModule.register([
          {
            name: KAFKA_CLIENT,
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: `${options.clientId}-producer`,
                brokers: getBrokers(),
              },
              producerOnlyMode: true,
            },
          },
        ]),
      ],
      providers: [KafkaPublisher],
      exports: [KafkaPublisher],
    };
  }
}
