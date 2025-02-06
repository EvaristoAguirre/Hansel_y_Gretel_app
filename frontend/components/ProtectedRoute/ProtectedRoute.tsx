'use client';
import React from "react";
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { validateUserSession } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!validateUserSession()) {
      router.push("/views/login");
    }
  }, [validateUserSession, router]);

  if (!validateUserSession) {
    // Podríamos mostrar un loader mientras redirige, o simplemente devolver null
    return <div>Cargando...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
