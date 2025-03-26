'use client';
import { FormType } from '@/components/Enums/Ingredients';
import { IUnitOfMeasure } from '@/components/Interfaces/IUnitOfMeasure';
import { createContext, use, useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { createUnit, editUnit, deleteUnit, fetchUnits } from '../../api/unitOfMeasure';
import { useAuth } from './authContext';


type UnitContextType = {
  units: IUnitOfMeasure[];
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
  units: [],
  formUnit: {
    name: "",
    abbreviation: "",
    equivalenceToBaseUnit: null,
    baseUnitId: "",
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
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [formUnit, setFormUnit] = useState<IUnitOfMeasure>({
    name: "",
    abbreviation: "",
    equivalenceToBaseUnit: null,
    baseUnitId: "",
  });
  const [formOpenUnit, setFormOpenUnit] = useState(false);
  const [formTypeUnit, setFormTypeUnit] = useState<FormType>(FormType.CREATE);
  const [units, setUnits] = useState<IUnitOfMeasure[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
    fetchUnits(token).then(dataUnit => {
      if (dataUnit) setUnits(dataUnit);
    });
  }, []);
  const addUnit = (unit: IUnitOfMeasure) => {
    setUnits([...units, unit]);
  }

  const updateUnit = (unit: IUnitOfMeasure) => {
    const updatedUnits = units.map((u) => {
      if (u.id === unit.id) {
        return unit;
      }
      return u;
    });
    setUnits(updatedUnits);
  }

  const removeUnit = (id: string) => {
    setUnits(units.filter((unit) => unit.id !== id));
  }
  const handleCreateUnit = async () => {
    try {
      const preparedForm = {
        ...formUnit,
        equivalenceToBaseUnit: parseFloat(formUnit.equivalenceToBaseUnit as any),
      };
      const newUnit = await createUnit(preparedForm, token as string);
      addUnit(newUnit);

      handleCloseFormUnit();

      Swal.fire("Éxito", "Ingrediente creado correctamente.", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo crear el ingrediente.", "error");
      console.error(error);
    }
  };

  const handleEditUnit = async () => {
    try {
      const preparedForm = {
        ...formUnit,
        equivalenceToBaseUnit: parseFloat(formUnit.equivalenceToBaseUnit as any),
        id: formUnit.id,
      };
      const updatedUnit = await editUnit(preparedForm, token as string);

      updateUnit(updatedUnit);

      Swal.fire("Éxito", "Unidad de medida editada correctamente.", "success");

      handleCloseFormUnit();

    } catch (error) {
      Swal.fire("Error", "No se pudo editar la unidad de medida.", "error");
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
        const deletedIngredient = await deleteUnit(id, token as string);
        if (deletedIngredient) {
          removeUnit(id);
        }
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
      abbreviation: "",
      equivalenceToBaseUnit: null,
      baseUnitId: "",
    });
  };

  return (
    <UnitContext.Provider
      value={{
        units,
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