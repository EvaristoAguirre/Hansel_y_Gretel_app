'use client';
import React, { useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import { UserRole } from "../Enums/user";
import Swal from "sweetalert2";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { userRoleFromToken } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    setRole(userRoleFromToken());
    if (role === UserRole.MOZO) {
      Swal.fire(
        "Acceso Denegado",
        "No tienes permiso para acceder a esta sección.",
        "error");
      router.push("/views/login");
    }
  }, [role, router]);

  return <>{children}</>;
};

export default ProtectedRoute;