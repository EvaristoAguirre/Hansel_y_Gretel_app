"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { IDailyCash, IDailyCheck, INewMovement, I_DC_Open_Close } from '@/components/Interfaces/IDailyCash';
import { useAuth } from "@/app/context/authContext";
import { checkOpenDailyCash, closeDailyCash, fetchAllDailyCash, fetchDailyCashByID, newMovement, openDailyCash } from "@/api/dailyCash";
import Swal from "sweetalert2";

interface DailyCashContextType {
  allDailyCash: IDailyCash[];
  dailyCash: IDailyCheck | null;
  loading: boolean;
  fetchAllCash: () => Promise<void>;
  fetchCash: () => Promise<void>;
  selectedCash: (cash: string) => void;
  openCash: (data: I_DC_Open_Close) => Promise<void>;
  closeCash: (data: I_DC_Open_Close) => Promise<void>;
  registerMovement: (data: INewMovement) => Promise<void>;
}

const DailyCashContext = createContext<DailyCashContextType | undefined>(undefined);

export const DailyCashProvider = ({ children }: { children: React.ReactNode }) => {
  const [dailyCash, setDailyCash] = useState<IDailyCheck | null>(null);
  const [allDailyCash, setAllDailyCash] = useState<IDailyCash[]>([]);
  const [selectedDailyCashId, setSelectedDailyCashID] = useState<string | null>(null);

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
      if (currentCash?.dailyCashOpenId) {
        const detail = await fetchDailyCashByID(token, currentCash.dailyCashOpenId);
        setDailyCash(detail);
      } else {
        setDailyCash(null);
      }
    } catch (error) {
      console.error("Error al obtener la caja actual", error);
    } finally {
      setLoading(false);
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
    const response = await newMovement(token, data);
    await fetchCash();
    return response;
  };

  useEffect(() => {
    fetchCash();
  }, [token]);

  return (
    <DailyCashContext.Provider
      value={{
        allDailyCash,
        dailyCash,
        loading,
        fetchAllCash,
        fetchCash,
        selectedCash,
        openCash,
        closeCash,
        registerMovement
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
