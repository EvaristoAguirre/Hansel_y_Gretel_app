'use client';
import { FormType } from '@/components/Enums/Ingredients';
import { IUnitOfMeasureForm, IUnitOfMeasureResponse } from '@/components/Interfaces/IUnitOfMeasure';
import { createContext, use, useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { createUnit, editUnit, deleteUnit, fetchUnits, allUnitsConventional, fetchUnitsNoConventional, fetchUnitOfMass, fetchUnitOfVolume, fetchUnitOfUnit } from '../../api/unitOfMeasure';
import { useAuth } from './authContext';
import { log } from 'console';


type UnitContextType = {
  units: IUnitOfMeasureForm[];
  unitsOfMass: IUnitOfMeasureForm[];
  unitsOfVolume: IUnitOfMeasureForm[];
  unitsOfUnit: IUnitOfMeasureForm[];
  formUnit: IUnitOfMeasureForm;
  setFormUnit: React.Dispatch<React.SetStateAction<IUnitOfMeasureForm>>;
  formOpenUnit: boolean;
  setFormOpenUnit: React.Dispatch<React.SetStateAction<boolean>>;
  formTypeUnit: FormType;
  setFormTypeUnit: React.Dispatch<React.SetStateAction<FormType>>;
  handleDeleteUnit: (id: string) => Promise<void>;
  handleCreateUnit: () => Promise<void>;
  handleEditUnit: () => Promise<void>;
  handleCloseFormUnit: () => void;
  conventionalUnits: IUnitOfMeasureResponse[];
  noConventionalUnits: IUnitOfMeasureForm[];
  fetchUnitsMass: () => Promise<IUnitOfMeasureForm[]>;
  fetchUnitsVolume: () => Promise<IUnitOfMeasureForm[]>;
  fetchUnitsUnit: () => Promise<IUnitOfMeasureForm[]>;
}

const UnitContext = createContext<UnitContextType>({
  units: [],
  unitsOfMass: [],
  unitsOfVolume: [],
  unitsOfUnit: [],
  formUnit: {
    name: "",
    abbreviation: "",
    conversions: []
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
  conventionalUnits: [],
  noConventionalUnits: [],
  fetchUnitsMass: () => Promise.resolve([]),
  fetchUnitsVolume: () => Promise.resolve([]),
  fetchUnitsUnit: () => Promise.resolve([]),
});

export const useUnitContext = () => {
  const context = useContext(UnitContext);
  return context;
};



const UnitProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [formUnit, setFormUnit] = useState<IUnitOfMeasureForm>({
    name: "",
    abbreviation: "",
    conversions: []
  });

  const [formOpenUnit, setFormOpenUnit] = useState(false);
  const [formTypeUnit, setFormTypeUnit] = useState<FormType>(FormType.CREATE);
  const [units, setUnits] = useState<IUnitOfMeasureForm[]>([]);
  const [conventionalUnits, setConventionalUnits] = useState<IUnitOfMeasureResponse[]>([]);
  const [noConventionalUnits, setNoConventionalUnits] = useState<IUnitOfMeasureForm[]>([]);
  const [unitsOfMass, setUnitsOfMass] = useState<IUnitOfMeasureForm[]>([]);
  const [unitsOfVolume, setUnitsOfVolume] = useState<IUnitOfMeasureForm[]>([]);
  const [unitsOfUnit, setUnitsOfUnit] = useState<IUnitOfMeasureForm[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);

    fetchUnits(token, "1", "50").then(dataUnit => {
      if (dataUnit) setUnits(dataUnit);

    });

    allUnitsConventional(token).then(dataUnit => {
      if (dataUnit) setConventionalUnits(dataUnit);
    })

    fetchUnitsNoConventional(token).then(dataUnit => {
      if (dataUnit) setNoConventionalUnits(dataUnit);
    })
  }, []);
  const addUnit = (unit: IUnitOfMeasureForm) => {
    setNoConventionalUnits([...noConventionalUnits, unit]);
  }

  const updateUnit = (unit: IUnitOfMeasureForm) => {
    const updatedUnits = noConventionalUnits.map((u) => {
      if (u.id === unit.id) {
        return unit;
      }
      return u;
    });
    setNoConventionalUnits(updatedUnits);
  }

  const removeUnit = (id: string) => {
    setNoConventionalUnits(noConventionalUnits.filter((unit) => unit.id !== id));
  }
  const handleCreateUnit = async () => {
    try {
      const newUnit = await createUnit(formUnit, token as string);
      addUnit(newUnit);
      handleCloseFormUnit();
      Swal.fire("Éxito", "Unidad de medida creada correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la unidad de medida.", "error");
      console.error(error);
    }
  };

  const fetchUnitsMass = async () => {
    try {
      const response = await fetchUnitOfMass(token as string);
      setUnitsOfMass(response);
      return response;
    } catch (error) {
      console.error("Error al obtener las unidades de masa:", error);
    }
  };

  const fetchUnitsVolume = async () => {
    try {
      const response = await fetchUnitOfVolume(token as string);
      setUnitsOfVolume(response);
      return response;
    } catch (error) {
      console.error("Error al obtener las unidades de masa:", error);
    }
  };

  const fetchUnitsUnit = async () => {
    try {
      const response = await fetchUnitOfUnit(token as string);
      setUnitsOfUnit(response);
      return response;
    } catch (error) {
      console.error("Error al obtener las unidades de masa:", error);
    }
  };

  const handleEditUnit = async () => {
    /**
     * Estamos editando la unidad de medida, por lo tanto, debemos
     * convertir los factores de conversión a dos decimales y asignarlos al objeto
     */
    const updatedFormUnit = {
      ...formUnit,
      conversions: formUnit.conversions.map((conversion) => ({
        ...conversion,
        conversionFactor: parseFloat(Number(conversion.conversionFactor).toFixed(4)),
      })),
    };
    try {
      const updatedUnit = await editUnit(updatedFormUnit, token as string);

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
        const deletedUnit = await deleteUnit(id, token as string);
        if (deletedUnit) {
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
      conversions: []
    });
  };

  return (
    <UnitContext.Provider
      value={{
        units,
        unitsOfMass,
        unitsOfVolume,
        unitsOfUnit,
        formUnit,
        conventionalUnits,
        noConventionalUnits,
        formOpenUnit,
        formTypeUnit,
        fetchUnitsMass,
        fetchUnitsVolume,
        fetchUnitsUnit,
        setFormUnit,
        setFormOpenUnit,
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