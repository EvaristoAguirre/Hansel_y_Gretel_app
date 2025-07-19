import { Ingredient } from './ingredient.entity';

export class IngredientResponseFormatter {
  static format(ingredient: Ingredient): any {
    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return {
      ...ingredient,
      cost: formatter.format(Number(ingredient.cost)),
      extraCost:
        ingredient.extraCost !== null && ingredient.extraCost !== undefined
          ? formatter.format(Number(ingredient.extraCost))
          : null,
    };
  }

  static formatMany(ingredients: Ingredient[]): any[] {
    return ingredients.map((ingredient) => this.format(ingredient));
  }
}
