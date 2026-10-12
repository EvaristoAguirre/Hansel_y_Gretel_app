'use client';
import { FormType } from '@/components/Enums/Ingredients';
import { IUnitOfMeasureForm, IUnitOfMeasureResponse } from '@/components/Interfaces/IUnitOfMeasure';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { createUnit, editUnit, deleteUnit, fetchUnits, allUnitsConventional, fetchUnitsNoConventional, fetchUnitOfMass, fetchUnitOfVolume, fetchUnitOfUnit } from '../../api/unitOfMeasure';
import { useAuth } from './authContext';
import { InflightSlot, shareInflight } from '@/lib/inflightByToken';


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

type LoadedUnits = {
  units: IUnitOfMeasureForm[] | null;
  conventional: IUnitOfMeasureResponse[] | null;
  noConventional: IUnitOfMeasureForm[] | null;
};

let unitsSlot: InflightSlot<LoadedUnits> = null;

function loadUnitLists(token: string) {
  return shareInflight(
    () => unitsSlot,
    (slot) => {
      unitsSlot = slot;
    },
    token,
    async () => {
      const [units, conventional, noConventional] = await Promise.all([
        fetchUnits(token, '1', '50'),
        allUnitsConventional(token),
        fetchUnitsNoConventional(token),
      ]);
      return {
        units: units ?? null,
        conventional: conventional ?? null,
        noConventional: noConventional ?? null,
      };
    },
  );
}



const UnitProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { accessToken, isAuthLoaded } = useAuth();
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
    if (!isAuthLoaded || !accessToken) return;
    let active = true;
    loadUnitLists(accessToken)
      .then((data) => {
        if (!active) return;
        if (data.units) setUnits(data.units);
        if (data.conventional) setConventionalUnits(data.conventional);
        if (data.noConventional) setNoConventionalUnits(data.noConventional);
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {
      active = false;
    };
  }, [isAuthLoaded, accessToken]);
  const addUnit = (unit: IUnitOfMeasureForm) => {
    setNoConventionalUnits([...noConventionalUnits, unit]);
    //agregamos a la lista de unidades de medida
    setUnits((prevUnits) =>
      prevUnits.filter((prevUnits) => prevUnits.id !== unit.id).concat(unit)
    );
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
  const handleCreateUnit = useCallback(async () => {
    if (!accessToken) return;
    try {
      const newUnit = await createUnit(formUnit, accessToken);
      addUnit(newUnit);
      handleCloseFormUnit();
      Swal.fire("Éxito", "Unidad de medida creada correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudo crear la unidad de medida.", "error");
      console.error(error);
    }
  }, [formUnit, accessToken]);

  const fetchUnitsMass = useCallback(async () => {
    if (!accessToken) return [];
    try {
      const response = await fetchUnitOfMass(accessToken);
      setUnitsOfMass(response);
      return response;
    } catch (error) {
      console.error("Error al obtener las unidades de masa:", error);
    }
  }, [accessToken]);

  const fetchUnitsVolume = useCallback(async () => {
    if (!accessToken) return [];
    try {
      const response = await fetchUnitOfVolume(accessToken);
      setUnitsOfVolume(response);
      return response;
    } catch (error) {
      console.error("Error al obtener las unidades de masa:", error);
    }
  }, [accessToken]);

  const fetchUnitsUnit = useCallback(async () => {
    if (!accessToken) return [];
    try {
      const response = await fetchUnitOfUnit(accessToken);
      setUnitsOfUnit(response);
      return response;
    } catch (error) {
      console.error("Error al obtener las unidades de masa:", error);
    }
  }, [accessToken]);

  const handleEditUnit = useCallback(async () => {
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
    if (!accessToken) return;
    try {
      const updatedUnit = await editUnit(updatedFormUnit, accessToken);

      updateUnit(updatedUnit);

      Swal.fire("Éxito", "Unidad de medida editada correctamente.", "success");

      handleCloseFormUnit();

    } catch (error) {
      Swal.fire("Error", "No se pudo editar la unidad de medida.", "error");
      console.error(error);
    }
  }, [formUnit, accessToken]);

  const handleDeleteUnit = useCallback(async (id: string) => {
    if (!accessToken) return;
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
        const deletedUnit = await deleteUnit(id, accessToken);
        if (deletedUnit) {
          removeUnit(id);
        }
        Swal.fire("Eliminado", "Unidad de medida eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la unidad de medida.", "error");
        console.error(error);
      }
    }
  }, [accessToken]);

  const handleCloseFormUnit = useCallback(() => {
    setFormOpenUnit(false);
    setFormUnit({
      name: "",
      abbreviation: "",
      conversions: []
    });
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
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
      handleDeleteUnit,
      handleCreateUnit,
      handleEditUnit,
      handleCloseFormUnit,
    ],
  );

  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};

export default UnitProvider;