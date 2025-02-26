'use client';
import { FormType } from '@/components/Enums/Ingredients';
import { Iingredient } from '@/components/Interfaces/Ingredients';
import { createContext, useContext, useState } from 'react';
import Swal from 'sweetalert2';


type IngredientsContextType = {
  formIngredients: Iingredient;
  setFormIngredients: React.Dispatch<React.SetStateAction<Iingredient>>;
  formOpen: boolean;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formType: FormType;
  setFormType: React.Dispatch<React.SetStateAction<FormType>>;
  handleDelete: (id: string) => Promise<void>;
}

const IngredientsContext = createContext<IngredientsContextType>({
  formIngredients: {
    id: "",
    name: "",
    description: "",
    price: null,
  },
  setFormIngredients: () => { },
  formOpen: false,
  setFormOpen: () => { },
  formType: FormType.CREATE,
  setFormType: () => { },
  handleDelete: async () => { },

});

export const useIngredientsContext = () => {
  const context = useContext(IngredientsContext);
  return context;
};

const IngredientsProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [formIngredients, setFormIngredients] = useState<Iingredient>({
    id: "",
    name: "",
    description: "",
    price: null,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>(FormType.CREATE);

  const handleDelete = async (id: string) => {
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
        //TOdo cambiar el fetch por el de INGREDIENTES
        // await fetch(`${URI_PRODUCT}/${id}`, { method: "DELETE" });
        // removeProduct(id);
        Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
        console.error(error);
      }
    }
  };

  return (
    <IngredientsContext.Provider
      value={{
        formIngredients,
        setFormIngredients,
        formOpen,
        setFormOpen,
        formType,
        setFormType,
        handleDelete

      }}
    >
      {children}
    </IngredientsContext.Provider>
  );
};

export default IngredientsProvider;