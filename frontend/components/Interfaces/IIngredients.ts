export interface IUnitOfMeasure {
    id: string;
    name: string;
    abbreviation: string;
  }
  
  export interface IStock {
    id: string;
    quantityInStock: number;
    minimumStock: number;
    unitOfMeasure?: IUnitOfMeasure | null;
  }
  
  export interface IngredientCreated {
    id: string;
    name: string;
    isActive: boolean;
    description?: string;
    cost: number;
    type: 'masa' | 'volumen' | 'unidad';
    unitOfMeasure: IUnitOfMeasure | null;
    stock: IStock | null;
  }
  
  export interface IngredientResponseDTO extends IngredientCreated {}
  
  export interface IngredientState {
    ingredients: IngredientCreated[];
    setIngredients: (ingredients: IngredientResponseDTO[]) => void;
    addIngredient: (ingredient: IngredientCreated) => void;
    removeIngredient: (id: string) => void;
    updateIngredient: (ingredient: IngredientCreated) => void;
    connectWebSocket: () => void;
  }
  