"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { IDailyCash, IDailyCheck, INewMovement, I_DC_Open, } from '@/components/Interfaces/IDailyCash';
import { useAuth } from "@/app/context/authContext";
import { checkOpenDailyCash, closeDailyCash, fetchAllDailyCash, fetchDailyCashByID, newMovement, openDailyCash } from "@/api/dailyCash";

interface DailyCashContextType {
  allDailyCash: IDailyCash[];
  dailyCash: IDailyCheck | null;
  loading: boolean;
  fetchAllCash: () => Promise<void>;
  fetchCash: () => Promise<void>;
  openCash: (data: I_DC_Open) => Promise<void>;
  closeCash: () => Promise<void>;
  registerMovement: (data: INewMovement) => Promise<void>;
}

const DailyCashContext = createContext<DailyCashContextType | undefined>(undefined);

export const DailyCashProvider = ({ children }: { children: React.ReactNode }) => {
  const [dailyCash, setDailyCash] = useState<IDailyCheck | null>(null);
  const [allDailyCash, setAllDailyCash] = useState<IDailyCash[]>([]);

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

  const openCash = async (data: I_DC_Open) => {
    if (!token) return;
    const opened = await openDailyCash(token, data);
    setDailyCash(opened);
  };

  const closeCash = async () => {
    if (!token || !dailyCash?.dailyCashOpenId) return;
    await closeDailyCash(token, dailyCash.dailyCashOpenId);
    setDailyCash(null);
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
