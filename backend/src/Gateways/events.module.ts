import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
    providers: [EventsGateway], // Lo registra como proveedor
    exports: [EventsGateway], // Lo exporta para que otros módulos lo usen
})
export class EventsModule { }
