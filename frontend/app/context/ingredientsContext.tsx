'use client';
import { FormType } from '@/components/Enums/ingredients';
import { Iingredient } from '@/components/Interfaces/Ingredients';
import { createContext, useContext, useState } from 'react';
import Swal from 'sweetalert2';
import { createIngredient, deleteIngredient, editIngredient, fetchIngredients } from '../../api/ingredients';
import { useEffect } from 'react';
import { useAuth } from './authContext';
import { IUnitOfMeasureStandard } from '@/components/Interfaces/IUnitOfMeasure';


type IngredientsContextType = {
  formIngredients: Iingredient;
  formOpen: boolean;
  formType: FormType;
  ingredients: Iingredient[];
  setFormIngredients: React.Dispatch<React.SetStateAction<Iingredient>>;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setFormType: React.Dispatch<React.SetStateAction<FormType>>;
  handleDeleteIngredient: (id: string) => Promise<void>;
  handleCreateIngredient: () => Promise<void>;
  handleEditIngredient: () => Promise<void>;
  handleCloseForm: () => void;
  updateIngredient: (ingredient: Iingredient) => void;
}

const IngredientsContext = createContext<IngredientsContextType>({
  formIngredients: {
    id: "",
    name: "",
    description: "",
    cost: null,
    unitOfMeasureId: "",
    stock: null,
    type: null
  },
  setFormIngredients: () => { },
  formOpen: false,
  setFormOpen: () => { },
  formType: FormType.CREATE,
  setFormType: () => { },
  handleDeleteIngredient: async () => { },
  handleCreateIngredient: async () => { },
  handleEditIngredient: async () => { },
  handleCloseForm: () => { },
  ingredients: [],
  updateIngredient: () => { },

});



export const useIngredientsContext = () => {
  const context = useContext(IngredientsContext);
  return context;
};

const IngredientsProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [formIngredients, setFormIngredients] = useState<Iingredient>({
    name: "",
    description: "",
    cost: null,
    unitOfMeasureId: "",
    stock: null,
    type: null
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>(FormType.CREATE);
  const [ingredients, setIngredients] = useState<Iingredient[]>([]);
  const { getAccessToken } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    fetchIngredients(token).then(dataIngredients => {
      if (dataIngredients) setIngredients(dataIngredients);
    });
  }, []);

  const addIngredient = (ingredient: Iingredient) => {
    setIngredients((prevIngredient) => [...prevIngredient, ingredient]);
  };

  const updateIngredient = (ingredient: Iingredient) => {

    setIngredients((prevIngredients) =>
      prevIngredients.map((prevIngredient) =>
        prevIngredient.id === ingredient.id ? ingredient : prevIngredient
      )
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prevIngredients) =>
      prevIngredients.filter((prevIngredient) => prevIngredient.id !== id)
    );
  };

  const handleCreateIngredient = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const preparedForm = {
        ...formIngredients,
        cost: parseFloat(formIngredients.cost as any),
      };
      const newIngredient = await createIngredient(preparedForm, token);
      addIngredient(newIngredient);

      handleCloseForm();

      Swal.fire("Éxito", "Ingrediente creado correctamente.", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo crear el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleEditIngredient = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const preparedForm = {
        ...formIngredients,
        cost: parseFloat(formIngredients.cost as any),
        id: formIngredients.id,
        unitOfMeasureId: (formIngredients.unitOfMeasureId as IUnitOfMeasureStandard)?.id ?? formIngredients.unitOfMeasureId
      };


      const updatedIngredient = await editIngredient(preparedForm, token);

      updateIngredient(updatedIngredient);

      Swal.fire("Éxito", "Ingrediente editado correctamente.", "success");

      handleCloseForm();

    } catch (error) {
      Swal.fire("Error", "No se pudo editar el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;

    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        const deletedIngredient = await deleteIngredient(id, token);
        if (deletedIngredient) {
          removeIngredient(id);
        }
        Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
        console.error(error);
      }
    }
  };
  const handleCloseForm = () => {
    setFormOpen(false);
    setFormIngredients({
      id: "",
      name: "",
      description: "",
      cost: null,
      unitOfMeasureId: "",
      stock: null,
      type: null,
    });
  };

  return (
    <IngredientsContext.Provider
      value={{
        formIngredients,
        formOpen,
        formType,
        ingredients,
        updateIngredient,
        setFormIngredients,
        setFormOpen,
        setFormType,
        handleDeleteIngredient,
        handleCreateIngredient,
        handleEditIngredient,
        handleCloseForm,

      }}
    >
      {children}
    </IngredientsContext.Provider>
  );
};

export default IngredientsProvider;