import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class DailyCashWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('dailyCash.opened')
  handleDailyCashOpened(event: { dailyCash: DailyCash }) {
    this.broadcastService.broadcast('dailyCashOpened', event.dailyCash);
  }

  @OnEvent('dailyCash.updated')
  handleDailyCashUpdated(event: { dailyCash: DailyCash }) {
    this.broadcastService.broadcast('dailyCashUpdated', event.dailyCash);
  }

  @OnEvent('dailyCash.closed')
  handleDailyCashClosed(event: { dailyCash: DailyCash }) {
    this.broadcastService.broadcast('dailyCashClosed', event.dailyCash);
  }
}
