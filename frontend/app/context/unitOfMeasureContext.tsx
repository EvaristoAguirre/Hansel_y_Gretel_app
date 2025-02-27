'use client';
import { FormType } from '@/components/Enums/Ingredients';
import { IUnitOfMeasure } from '@/components/Interfaces/IUnitOfMeasure';
import { createContext, useContext, useState } from 'react';
import Swal from 'sweetalert2';


type UnitContextType = {
  formUnit: IUnitOfMeasure;
  setFormUnit: React.Dispatch<React.SetStateAction<IUnitOfMeasure>>;
  formOpenUnit: boolean;
  setFormOpenUnit: React.Dispatch<React.SetStateAction<boolean>>;
  formTypeUnit: FormType;
  setFormTypeUnit: React.Dispatch<React.SetStateAction<FormType>>;
  handleDeleteUnit: (id: string) => Promise<void>;
  handleCreateUnit: () => Promise<void>;
  handleEditUnit: () => Promise<void>;
  handleCloseFormUnit: () => void;

}

const UnitContext = createContext<UnitContextType>({
  formUnit: {
    quantity: null,
    name: "",
    abbreviation: "",
    equivalent_quantity: null,
    equivalent_unit: "",
  },
  setFormUnit: () => { },
  formOpenUnit: false,
  setFormOpenUnit: () => { },
  formTypeUnit: FormType.CREATE,
  setFormTypeUnit: () => { },
  handleDeleteUnit: async () => { },
  handleCreateUnit: async () => { },
  handleEditUnit: async () => { },
  handleCloseFormUnit: () => { },
});

export const useUnitContext = () => {
  const context = useContext(UnitContext);
  return context;
};

const UnitProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [formUnit, setFormUnit] = useState<IUnitOfMeasure>({
    name: "",
    quantity: null,
    abbreviation: "",
    equivalent_quantity: null,
    equivalent_unit: "",
  });
  const [formOpenUnit, setFormOpenUnit] = useState(false);
  const [formTypeUnit, setFormTypeUnit] = useState<FormType>(FormType.CREATE);

  const handleCreateUnit = async () => {
    try {
      // const preparedForm = {
      //   ...formUnit,
      //   price: parseFloat(formUnit.price as any),
      //   cost: parseFloat(formUnit.cost as any),
      // };
      //TODO cambiar el fetch por el de INGREDIENTES
      // const newProduct = await createProduct(preparedForm);
      // addProduct(newProduct);

      handleCloseFormUnit();

      Swal.fire("Éxito", "Ingrediente creado correctamente.", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo crear el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleEditUnit = async () => {
    try {
      // const preparedForm = {
      //   ...formUnit,
      //   price: parseFloat(formUnits.price as any),
      //   cost: parseFloat(formUnit.cost as any),
      //   id: formUnit.id,
      // };
      //TODO cambiar el fetch por el de INGREDIENTES
      // const updatedProduct = await editProduct(preparedForm);

      // updateProduct(updatedProduct);

      Swal.fire("Éxito", "Ingrediente editado correctamente.", "success");

      handleCloseFormUnit();

    } catch (error) {
      Swal.fire("Error", "No se pudo editar el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleDeleteUnit = async (id: string) => {
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
  const handleCloseFormUnit = () => {
    setFormOpenUnit(false);
    setFormUnit({
      name: "",
      quantity: null,
      abbreviation: "",
      equivalent_quantity: null,
      equivalent_unit: "",
    });
  };

  return (
    <UnitContext.Provider
      value={{
        formUnit,
        setFormUnit,
        formOpenUnit,
        setFormOpenUnit,
        formTypeUnit,
        setFormTypeUnit,
        handleDeleteUnit,
        handleCreateUnit,
        handleEditUnit,
        handleCloseFormUnit,


      }}
    >
      {children}
    </UnitContext.Provider>
  );
};

export default UnitProvider;