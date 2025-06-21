"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { IDailyCash, INewMovement, I_DC_Open } from "@/components/Interfaces/IDailyCash";
import { useAuth } from "@/app/context/authContext";
import { checkOpenDailyCash, closeDailyCash, fetchDailyCashByID, newMovement, openDailyCash } from "@/api/dailyCash";

interface DailyCashContextType {
  dailyCash: IDailyCash | null;
  loading: boolean;
  fetchCash: () => Promise<void>;
  openCash: (data: I_DC_Open) => Promise<void>;
  closeCash: () => Promise<void>;
  registerMovement: (data: INewMovement) => Promise<void>;
}

const DailyCashContext = createContext<DailyCashContextType | undefined>(undefined);

export const DailyCashProvider = ({ children }: { children: React.ReactNode }) => {
  const [dailyCash, setDailyCash] = useState<IDailyCash | null>(null);
  const [loading, setLoading] = useState(true);

  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const fetchCash = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const currentCash = await checkOpenDailyCash(token);
      if (currentCash?.id) {
        const detail = await fetchDailyCashByID(token, currentCash.id);
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
    if (!token || !dailyCash?.id) return;
    await closeDailyCash(token, dailyCash.id);
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
    <DailyCashContext.Provider value={{ dailyCash, loading, fetchCash, openCash, closeCash, registerMovement }}>
      {children}
    </DailyCashContext.Provider>
  );
};

export const useDailyCash = () => {
  const context = useContext(DailyCashContext);
  if (!context) throw new Error("useDailyCash debe usarse dentro de un DailyCashProvider");
  return context;
};
