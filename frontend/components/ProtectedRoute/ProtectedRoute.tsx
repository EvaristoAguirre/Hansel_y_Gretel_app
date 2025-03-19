"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import { UserRole } from "../Enums/user";
import Swal from "sweetalert2";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[]; // Definir roles permitidos como prop
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { userRoleFromToken, validateUserSession } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!validateUserSession()) {
      router.push("/views/login");
      return;
    }

    const currentRole = userRoleFromToken();
    setRole(currentRole);

    if (!allowedRoles.includes(currentRole as UserRole)) {
      Swal.fire(
        "Acceso Denegado",
        "No tienes permiso para acceder a esta sección.",
        "error"
      );
      router.push("/");
    }
  }, [validateUserSession, router, allowedRoles]);

  return role && allowedRoles.includes(role as UserRole) ? <>{children}</> : null;
};

export default ProtectedRoute;
