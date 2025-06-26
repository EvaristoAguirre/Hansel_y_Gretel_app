import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Ingredient } from 'src/Ingredient/ingredient.entity';

@Injectable()
export class IngredientWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('ingredient.created')
  handleIngredientCreated(event: { ingredient: Ingredient }) {
    this.broadcastService.broadcast('ingredientCreated', event.ingredient);
  }

  @OnEvent('ingredient.updated')
  handleIngredientUpdated(event: { ingredient: Ingredient }) {
    this.broadcastService.broadcast('ingredientUpdated', event.ingredient);
  }

  @OnEvent('ingredient.deleted')
  handleIngredientDeleted(event: { ingredient: Ingredient }) {
    this.broadcastService.broadcast('ingredientDeleted', event.ingredient);
  }

  @OnEvent('topping.updated')
  handleToppingUpdated(event: { topping: Ingredient }) {
    this.broadcastService.broadcast('toppingUpdated', event.topping);
  }
}
