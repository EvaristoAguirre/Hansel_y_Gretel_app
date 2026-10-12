import { describe, expect, it } from 'vitest';
import { listsAfterRemovingIngredient } from './ingredientLists';
import { Iingredient } from '@/components/Interfaces/Ingredients';

const topping = {
  id: 'top-1',
  name: 'Crema',
  description: '',
  cost: 10,
  type: null,
  isTopping: true,
} as Iingredient;

const flour = {
  id: 'ing-1',
  name: 'Harina',
  description: '',
  cost: 20,
  type: null,
  isTopping: false,
} as Iingredient;

describe('listsAfterRemovingIngredient', () => {
  it('al borrar un topping no toca la lista de ingredientes', () => {
    const next = listsAfterRemovingIngredient(
      [flour, topping],
      [flour],
      'top-1',
    );

    expect(next.ingredientsAndToppings).toEqual([flour]);
    expect(next.ingredients).toEqual([flour]);
  });

  it('al borrar un ingrediente lo saca de las dos listas', () => {
    const next = listsAfterRemovingIngredient(
      [flour, topping],
      [flour],
      'ing-1',
    );

    expect(next.ingredientsAndToppings).toEqual([topping]);
    expect(next.ingredients).toEqual([]);
  });
});
