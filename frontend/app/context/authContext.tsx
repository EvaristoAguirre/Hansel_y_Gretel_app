'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "jwt-decode";
import Swal from "sweetalert2";

interface AuthContextProps {
  user: any;
  setUser: (user: any) => void;
  validateUserSession: () => boolean | null;
  userRoleFromToken: () => string | null;
  handleSignOut: () => void;
  usernameFromToken: () => string;
}

interface CustomJwtPayload extends JwtPayload {
  role: string;
  username: string;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  setUser: () => { },
  validateUserSession: () => null,
  userRoleFromToken: () => null,
  handleSignOut: () => { },
  usernameFromToken: () => "",
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  // Cargar el usuario almacenado en localStorage una sola vez (en el cliente)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
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
        localStorage.removeItem("user");
        // Opcional: actualizar el estado si lo usas en otras partes de tu app
        setUser(null);
        window.location.href = "/views/login";
      }
    });
  };

  const userRoleFromToken = useCallback((): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const userSession = localStorage.getItem("user");
    if (!userSession) {
      return null;
    }

    try {
      const token = JSON.parse(userSession).accessToken;
      if (!token) {
        return null;
      }
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      return decodedToken.role;
    } catch (error) {
      console.error("Failed to decode token", error);
      return null;
    }
  }, []);

  const usernameFromToken = useCallback((): string => {
    if (typeof window === "undefined") {
      return "";
    }

    const userSession = localStorage.getItem("user");
    if (!userSession) {
      return "";
    }

    try {
      const token = JSON.parse(userSession).accessToken;
      if (!token) {
        return "";
      }
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      return decodedToken.username || "";
    } catch (error) {
      console.error("Failed to decode token", error);
      return "";
    }
  }, []);

  const validateUserSession = () => {
    if (typeof window !== "undefined") {
      const userSession = localStorage.getItem("user");
      return userSession ? true : null;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        validateUserSession,
        userRoleFromToken,
        handleSignOut,
        usernameFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
