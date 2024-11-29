import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Category } from 'src/Category/category.entity';

@Injectable()
export class CategoryWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('category.created')
  handleCategoryCreated(event: { category: Category }) {
    // Evento por WS
    this.broadcastService.broadcast('categoryCreated', event.category);
  }
  @OnEvent('category.updated')
  handleCategoryUpdated(event: { category: Category }) {
    // Evento por WS
    this.broadcastService.broadcast('categoryUpdated', event.category);
  }
  @OnEvent('category.deleted')
  handleCategoryDeleted(event: { category: string }) {
    // Evento por WS
    this.broadcastService.broadcast('categoryDeleted', event.category);
  }
}
