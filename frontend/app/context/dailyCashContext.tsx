"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { IDailyCash, IDailyCheck, IDailyResume, INewMovement, I_DC_Open_Close } from '@/components/Interfaces/IDailyCash';
import { useAuth } from "@/app/context/authContext";
import { checkOpenDailyCash, closeDailyCash, deleteDailyCash, fetchAllDailyCash, fetchDailyCashByID, fetchDailyCashResume, newMovement, openDailyCash } from "@/api/dailyCash";
import Swal from "sweetalert2";

interface DailyCashContextType {
  allDailyCash: IDailyCash[];
  dailyCash: IDailyCheck | null;
  loading: boolean;
  dailyCashSummary: IDailyResume | null;
  fetchAllCash: () => Promise<void>;
  fetchCash: () => Promise<void>;
  selectedCash: (cash: string) => void;
  openCash: (data: I_DC_Open_Close) => Promise<void>;
  closeCash: (data: I_DC_Open_Close) => Promise<void>;
  registerMovement: (data: INewMovement) => Promise<void>;
  fetchCashSummary: () => Promise<void>;
  deleteCash: (id: string) => Promise<void>;
}

const DailyCashContext = createContext<DailyCashContextType | undefined>(undefined);

export const DailyCashProvider = ({ children }: { children: React.ReactNode }) => {
  const [dailyCash, setDailyCash] = useState<IDailyCheck | null>(null);
  const [allDailyCash, setAllDailyCash] = useState<IDailyCash[]>([]);
  const [selectedDailyCashId, setSelectedDailyCashID] = useState<string | null>(null);
  const [dailyCashSummary, setDailyCashSummary] = useState<IDailyResume | null>(null);

  const [loading, setLoading] = useState(true);

  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const fetchAllCash = async () => {
    if (!token) return;
    try {
      const allCash = await fetchAllDailyCash(token);
      setAllDailyCash(allCash);
    } catch (error) {
      console.error("Error al obtener todas las cajas", error);
    }
  };
  const fetchCash = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const currentCash = await checkOpenDailyCash(token);
      setDailyCash(currentCash);
    } catch (error) {
      console.error("Error al obtener la caja actual", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCashSummary = async () => {
    if (!token) return;
    try {
      const currentCash = await fetchDailyCashResume(token);
      setDailyCashSummary(currentCash);
    } catch (error) {
      console.error("Error al obtener la caja actual", error);
    }
  };

  const selectedCash = (cash: string) => {
    setSelectedDailyCashID(cash);
  };

  const openCash = async (data: I_DC_Open_Close) => {
    if (!token) return;
    const opened = await openDailyCash(token, data);
    if (opened) {
      Swal.fire("Éxito", "Caja abierta correctamente.", "success");
    } else {
      Swal.fire("Error", "No se pudo abrir la caja.", "error");
    }
    await fetchAllCash();
  };

  const closeCash = async (data: I_DC_Open_Close) => {
    if (!token) return;
    const response = selectedDailyCashId && await closeDailyCash(token, selectedDailyCashId, data);
    if (response) {
      Swal.fire("Éxito", "Caja cerrada correctamente.", "success");
    } else {
      Swal.fire("Error", "No se pudo cerrar la caja.", "error");
    }
    await fetchAllCash();
  };

  const registerMovement = async (data: INewMovement) => {
    if (!token) return;
    const body = {
      dailyCashId: dailyCash?.dailyCashOpenId || "",
      movementType: data.movementType,
      description: data.description,
      payments: data.payments
    }
    const response = await newMovement(token, body);
    await fetchAllCash();
    await fetchCashSummary();
    return response;
  };

  useEffect(() => {
    fetchCash();
  }, [token]);

  const deleteCash = async (id: string) => {
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
        await deleteDailyCash(token, id);
        Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
        await fetchAllCash();
      } catch (error) {
        console.error("Error al eliminar la caja", error);
        Swal.fire("Error", "No se pudo eliminar la caja.", "error");
      }
    }

  };

  return (
    <DailyCashContext.Provider
      value={{
        allDailyCash,
        dailyCash,
        loading,
        dailyCashSummary,
        fetchAllCash,
        fetchCash,
        selectedCash,
        openCash,
        closeCash,
        registerMovement,
        fetchCashSummary,
        deleteCash
      }}>
      {children}
    </DailyCashContext.Provider>
  );
};

export const useDailyCash = () => {
  const context = useContext(DailyCashContext);
  if (!context) throw new Error("useDailyCash debe usarse dentro de un DailyCashProvider");
  return context;
};
