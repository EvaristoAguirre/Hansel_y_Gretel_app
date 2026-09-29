import { Iingredient } from '@/components/Interfaces/Ingredients';

export function listsAfterRemovingIngredient(
  ingredientsAndToppings: Iingredient[],
  ingredients: Iingredient[],
  id: string,
): { ingredientsAndToppings: Iingredient[]; ingredients: Iingredient[] } {
  const removed =
    ingredientsAndToppings.find((item) => item.id === id) ??
    ingredients.find((item) => item.id === id);

  const nextCombined = ingredientsAndToppings.filter((item) => item.id !== id);
  if (removed?.isTopping) {
    return { ingredientsAndToppings: nextCombined, ingredients };
  }

  return {
    ingredientsAndToppings: nextCombined,
    ingredients: ingredients.filter((item) => item.id !== id),
  };
}
