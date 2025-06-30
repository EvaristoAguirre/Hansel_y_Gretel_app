import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ToppingsGroup } from 'src/ToppingsGroup/toppings-group.entity';

@Injectable()
export class ToppingsGroupWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('toppingsGroup.created')
  handleToppingsGroupCreated(event: { toppingsGroup: ToppingsGroup }) {
    this.broadcastService.broadcast(
      'toppingsGroupCreated',
      event.toppingsGroup,
    );
  }

  @OnEvent('toppingsGroup.updated')
  handleToppingsGroupUpdated(event: { toppingsGroup: ToppingsGroup }) {
    this.broadcastService.broadcast(
      'toppingsGroupUpdated',
      event.toppingsGroup,
    );
  }
  @OnEvent('toppingsGroup.deleted')
  handleToppingsGroupDeleted(event: { toppingsGroup: ToppingsGroup }) {
    this.broadcastService.broadcast(
      'toppingsGroupDeleted',
      event.toppingsGroup,
    );
  }
}
