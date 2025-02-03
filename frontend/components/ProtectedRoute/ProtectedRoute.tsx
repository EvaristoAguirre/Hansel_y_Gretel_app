'use client';
import React, { useEffect } from "react";
import { useAuth } from "@/app/context/authContext";


//Componente para proteger rutas
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { validateUserSession } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!validateUserSession()) {
        window.location.href = "/views/login";
      }
    }
  }, [validateUserSession])


  // Si no está logueado, no renderizamos la vista, pero la redirección será inmediata
  return <>{validateUserSession() ? children : null}</>;
};

export default ProtectedRoute;
