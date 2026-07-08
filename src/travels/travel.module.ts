import { Module } from '@nestjs/common';
import { TravelService } from './application/service/travel.service';
import { TravelController } from './infraestructure/controller/travel.controller';
import { TravelRepositoryAdapter } from './infraestructure/persistence/travel-repository.adapter';
import { TravelMapper } from './infraestructure/persistence/travel.mapper';
import { RabbitEventPublisher } from './infraestructure/rabbit/rabbit-event-publisher';
import { TRAVEL_REPOSITORY_PORT } from './application/ports/out/travel-repository.port';
import { EVENT_PUBLISHER_PORT } from './application/ports/out/event-publisher.port';

@Module({
  controllers: [TravelController],
  providers: [
    TravelService,
    TravelMapper,
    {
      provide: TRAVEL_REPOSITORY_PORT,
      useClass: TravelRepositoryAdapter,
    },
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: RabbitEventPublisher,
    },
  ],
})
export class TravelModule {}
