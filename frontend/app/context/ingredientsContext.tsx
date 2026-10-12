'use client';
import { Iingredient } from '@/components/Interfaces/Ingredients';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  createIngredient,
  deleteIngredient,
  editIngredient,
  fetchIngredientsAll,
  fetchIngredientsAndToppings,
} from '../../api/ingredients';
import { useEffect } from 'react';
import { useAuth } from './authContext';
import { listsAfterRemovingIngredient } from './ingredientLists';
import { InflightSlot, shareInflight } from '@/lib/inflightByToken';
import { IUnitOfMeasureStandard } from '@/components/Interfaces/IUnitOfMeasure';
import { FormType } from '@/components/Enums/Ingredients';
import { webSocketService } from '@/services/websocket.service';
import {
  patchStockQuantity,
  StockChange,
} from '@/components/Hooks/stockSnapshot';

type IngredientsContextType = {
  formIngredients: Iingredient;
  formOpen: boolean;
  formType: FormType;
  ingredients: Iingredient[];
  ingredientsAndToppings: Iingredient[];
  setFormIngredients: React.Dispatch<React.SetStateAction<Iingredient>>;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setFormType: React.Dispatch<React.SetStateAction<FormType>>;
  handleDeleteIngredient: (id: string) => Promise<void>;
  handleCreateIngredient: () => Promise<void>;
  handleEditIngredient: () => Promise<void>;
  handleCloseForm: () => void;
  updateIngredient: (ingredient: Iingredient) => void;
};

const IngredientsContext = createContext<IngredientsContextType>({
  formIngredients: {
    id: '',
    name: '',
    description: '',
    cost: null,
    unitOfMeasureId: '',
    stock: null,
    type: null,
  },
  setFormIngredients: () => {},
  formOpen: false,
  setFormOpen: () => {},
  formType: FormType.CREATE,
  setFormType: () => {},
  handleDeleteIngredient: async () => {},
  handleCreateIngredient: async () => {},
  handleEditIngredient: async () => {},
  handleCloseForm: () => {},
  ingredients: [],
  ingredientsAndToppings: [],
  updateIngredient: () => {},
});

export const useIngredientsContext = () => {
  const context = useContext(IngredientsContext);
  return context;
};

type LoadedIngredients = {
  combined: Iingredient[] | null;
  ingredients: Iingredient[] | null;
};

let ingredientsSlot: InflightSlot<LoadedIngredients> = null;

function loadIngredientLists(token: string) {
  return shareInflight(
    () => ingredientsSlot,
    (slot) => {
      ingredientsSlot = slot;
    },
    token,
    async () => {
      const [combined, ingredients] = await Promise.all([
        fetchIngredientsAndToppings(token),
        fetchIngredientsAll(token),
      ]);
      return {
        combined: combined ?? null,
        ingredients: ingredients ?? null,
      };
    },
  );
}

const IngredientsProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [formIngredients, setFormIngredients] = useState<Iingredient>({
    name: '',
    description: '',
    cost: null,
    unitOfMeasureId: '',
    stock: null,
    type: null,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>(FormType.CREATE);
  const [ingredientsAndToppings, setIngredientsAndToppings] = useState<
    Iingredient[]
  >([]);
  const [ingredients, setIngredients] = useState<Iingredient[]>([]);
  const { getAccessToken, accessToken, isAuthLoaded } = useAuth();

  useEffect(() => {
    if (!isAuthLoaded || !accessToken) return;
    let active = true;
    loadIngredientLists(accessToken)
      .then((data) => {
        if (!active) return;
        if (data.combined) setIngredientsAndToppings(data.combined);
        if (data.ingredients) setIngredients(data.ingredients);
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {
      active = false;
    };
  }, [isAuthLoaded, accessToken]);

  useEffect(() => {
    const applyStockChanges = (payload: { stocks?: StockChange[] }) => {
      const stocks = payload?.stocks ?? [];
      if (!stocks.length) return;

      const patchList = (list: Iingredient[]) =>
        patchStockQuantity(list, stocks, (ingredient, stock) =>
          stock.ingredientId === ingredient.id ||
          stock.id === ingredient.stock?.id,
        );

      setIngredientsAndToppings(patchList);
      setIngredients(patchList);
    };

    webSocketService.on('stock.created', applyStockChanges);
    webSocketService.on('stock.updated', applyStockChanges);
    webSocketService.on('stock.deducted', applyStockChanges);
    webSocketService.on('stock.restored', applyStockChanges);

    return () => {
      webSocketService.off('stock.created', applyStockChanges);
      webSocketService.off('stock.updated', applyStockChanges);
      webSocketService.off('stock.deducted', applyStockChanges);
      webSocketService.off('stock.restored', applyStockChanges);
    };
  }, []);

  const addIngredient = (ingredient: Iingredient) => {
    setIngredientsAndToppings((prevIngredient) => [
      ...prevIngredient,
      ingredient,
    ]);
    if (!ingredient.isTopping) {
      setIngredients((prevIngredient) => [...prevIngredient, ingredient]);
    }
  };

  const updateIngredient = useCallback((ingredient: Iingredient) => {
    setIngredientsAndToppings((prevIngredients) =>
      prevIngredients.map((prevIngredient) =>
        prevIngredient.id === ingredient.id ? ingredient : prevIngredient
      )
    );

    if (!ingredient.isTopping) {
      setIngredients((prevIngredients) =>
        prevIngredients.map((prevIngredient) =>
          prevIngredient.id === ingredient.id ? ingredient : prevIngredient
        )
      );
    }
  }, []);

  const removeIngredient = useCallback((id: string) => {
    const next = listsAfterRemovingIngredient(
      ingredientsAndToppings,
      ingredients,
      id,
    );
    setIngredientsAndToppings(next.ingredientsAndToppings);
    setIngredients(next.ingredients);
  }, [ingredientsAndToppings, ingredients]);

  const handleCreateIngredient = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      // Filtrar campos que no deben enviarse al backend
      const { stock, id, ...formWithoutStock } = formIngredients;
      const preparedForm = {
        ...formWithoutStock,
        cost: parseFloat(formIngredients.cost as any),
      };
      const newIngredient = await createIngredient(preparedForm, token);

      handleCloseForm();

      addIngredient(newIngredient);

      Swal.fire('Éxito', 'Ingrediente creado correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error', 'No se pudo crear el ingrediente.', 'error');
      console.error(error);
    }
  }, [formIngredients, getAccessToken]);

  const handleEditIngredient = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const preparedForm = {
        ...formIngredients,
        cost: parseFloat(formIngredients.cost as any),
        id: formIngredients.id,
        unitOfMeasureId:
          (formIngredients.unitOfMeasureId as IUnitOfMeasureStandard)?.id ??
          formIngredients.unitOfMeasureId,
      };

      const updatedIngredient = await editIngredient(preparedForm, token);

      updateIngredient(updatedIngredient);

      Swal.fire('Éxito', 'Ingrediente editado correctamente.', 'success');

      handleCloseForm();
    } catch (error) {
      Swal.fire('Error', 'No se pudo editar el ingrediente.', 'error');
      console.error(error);
    }
  }, [formIngredients, getAccessToken, updateIngredient]);

  const handleDeleteIngredient = useCallback(async (id: string) => {
    const token = getAccessToken();
    if (!token) return;

    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        const deletedIngredient = await deleteIngredient(id, token);
        if (deletedIngredient) {
          removeIngredient(id);
        }
        Swal.fire('Eliminado', 'Ingrediente eliminado correctamente.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el ingrediente.', 'error');
        console.error(error);
      }
    }
  }, [getAccessToken, removeIngredient]);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setFormIngredients({
      id: '',
      name: '',
      description: '',
      cost: null,
      unitOfMeasureId: '',
      stock: null,
      type: null,
    });
  }, []);

  const value = useMemo(
    () => ({
      formIngredients,
      formOpen,
      formType,
      ingredients,
      ingredientsAndToppings,
      updateIngredient,
      setFormIngredients,
      setFormOpen,
      setFormType,
      handleDeleteIngredient,
      handleCreateIngredient,
      handleEditIngredient,
      handleCloseForm,
    }),
    [
      formIngredients,
      formOpen,
      formType,
      ingredients,
      ingredientsAndToppings,
      updateIngredient,
      handleDeleteIngredient,
      handleCreateIngredient,
      handleEditIngredient,
      handleCloseForm,
    ],
  );

  return (
    <IngredientsContext.Provider value={value}>
      {children}
    </IngredientsContext.Provider>
  );
};

export default IngredientsProvider;
