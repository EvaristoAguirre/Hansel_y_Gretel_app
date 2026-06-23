"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { useRouter, usePathname } from "next/navigation";
import { UserRole } from "../Enums/user";
import Swal from "sweetalert2";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { userRoleFromToken, validateUserSession, isAuthLoaded } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!validateUserSession()) {
      sessionStorage.setItem("redirectAfterLogin", pathname);
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
  }, [isAuthLoaded, validateUserSession, router, allowedRoles, pathname]);

  if (!isAuthLoaded) return null;

  return role && allowedRoles.includes(role as UserRole) ? <>{children}</> : null;
};

export default ProtectedRoute;
