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
  handleDeleteIngredient: (id: string) => Promise<void>;
  handleCreateIngredient: () => Promise<void>;
  handleEditIngredient: () => Promise<void>;
  handleCloseForm: () => void;
}

const IngredientsContext = createContext<IngredientsContextType>({
  formIngredients: {
    id: "",
    name: "",
    description: "",
    price: null,
    cost: null
  },
  setFormIngredients: () => { },
  formOpen: false,
  setFormOpen: () => { },
  formType: FormType.CREATE,
  setFormType: () => { },
  handleDeleteIngredient: async () => { },
  handleCreateIngredient: async () => { },
  handleEditIngredient: async () => { },
  handleCloseForm: () => { }

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
    cost: null
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>(FormType.CREATE);

  const handleCreateIngredient = async () => {
    try {
      const preparedForm = {
        ...formIngredients,
        price: parseFloat(formIngredients.price as any),
        cost: parseFloat(formIngredients.cost as any),
      };
      //TODO cambiar el fetch por el de INGREDIENTES
      // const newProduct = await createProduct(preparedForm);
      // addProduct(newProduct);

      handleCloseForm();

      Swal.fire("Éxito", "Ingrediente creado correctamente.", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo crear el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleEditIngredient = async () => {
    try {
      const preparedForm = {
        ...formIngredients,
        price: parseFloat(formIngredients.price as any),
        cost: parseFloat(formIngredients.cost as any),
        id: formIngredients.id,
      };
      //TODO cambiar el fetch por el de INGREDIENTES
      // const updatedProduct = await editProduct(preparedForm);

      // updateProduct(updatedProduct);

      Swal.fire("Éxito", "Ingrediente editado correctamente.", "success");

      handleCloseForm();

    } catch (error) {
      Swal.fire("Error", "No se pudo editar el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
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
  const handleCloseForm = () => {
    setFormOpen(false);
    setFormIngredients({
      id: "",
      name: "",
      description: "",
      price: null,
      cost: null,
    });
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