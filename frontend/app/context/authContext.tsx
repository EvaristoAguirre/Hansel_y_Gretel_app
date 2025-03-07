"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "jwt-decode";
import Swal from "sweetalert2";

interface AuthContextProps {
  user: any;
  accessToken: string | null;
  setUser: (user: any) => void;
  validateUserSession: () => boolean | null;
  userRoleFromToken: () => string | null;
  handleSignOut: () => void;
  usernameFromToken: () => string;
  getAccessToken: () => string | null;
  removeAccessToken: () => void;
}

interface CustomJwtPayload extends JwtPayload {
  role: string;
  username: string;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  accessToken: null,
  setUser: () => { },
  validateUserSession: () => null,
  userRoleFromToken: () => null,
  handleSignOut: () => { },
  usernameFromToken: () => "",
  getAccessToken: () => null,
  removeAccessToken: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setAccessToken(parsedUser.accessToken);
      }
    }
  }, []);

  const getAccessToken = (): string | null => {
    if (typeof window === "undefined") return null;
    const userSession = localStorage.getItem("user");
    if (!userSession) return null;
    try {
      return JSON.parse(userSession).accessToken;
    } catch (error) {
      console.error("Failed to retrieve token", error);
      return null;
    }
  };

  const removeAccessToken = useCallback((): void => {
    localStorage.removeItem("user");
    setUser(null);
    setAccessToken(null);
  }, []);

  const handleSignOut = async () => {
    Swal.fire({
      icon: "warning",
      title: "Cerrar sesión",
      text: "¿Estás seguro de que deseas cerrar sesión?",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        removeAccessToken();
        window.location.href = "/views/login";
      }
    });
  };

  const userRoleFromToken = useCallback((): string | null => {
    if (!accessToken) return null;
    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(accessToken);
      return decodedToken.role;
    } catch (error) {
      console.error("Failed to decode token", error);
      return null;
    }
  }, [accessToken]);

  const usernameFromToken = useCallback((): string => {
    if (!accessToken) return "";
    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(accessToken);
      return decodedToken.username || "";
    } catch (error) {
      console.error("Failed to decode token", error);
      return "";
    }
  }, [accessToken]);

  const validateUserSession = () => {
    return !!accessToken;
  };

  // 🔹 Verifica si el token ha expirado y programa alertas
  useEffect(() => {
    if (!accessToken) return;

    try {
      const decoded: { exp: number } = jwtDecode(accessToken);
      const expirationTime = decoded.exp * 1000 - Date.now(); // En milisegundos

      if (expirationTime <= 0) {
        removeAccessToken();
        window.location.href = "/views/login";
        return;
      }

      // 🔔 Notificar 1 minuto antes de la expiración
      const warningTime = expirationTime - 60000;
      if (warningTime > 0) {
        setTimeout(() => {
          Swal.fire({
            icon: "warning",
            title: "Sesión por expirar",
            text: "Tu sesión expirará en 1 minuto. Guarda tu trabajo o vuelve a iniciar sesión.",
            confirmButtonText: "OK",
          });
        }, warningTime);
      }

      // 🔴 Cerrar sesión automáticamente cuando el token expire
      setTimeout(() => {
        Swal.fire({
          icon: "error",
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Serás redirigido al login.",
          confirmButtonText: "OK",
        }).then(() => {
          removeAccessToken();
          window.location.href = "/views/login";
        });
      }, expirationTime);
    } catch (error) {
      console.error("Failed to decode token", error);
      removeAccessToken();
      window.location.href = "/views/login";
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        getAccessToken,
        setUser,
        validateUserSession,
        userRoleFromToken,
        handleSignOut,
        usernameFromToken,
        removeAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
