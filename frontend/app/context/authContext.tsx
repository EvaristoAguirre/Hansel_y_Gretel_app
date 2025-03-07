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
  accessToken: string | null;
  setUser: (user: any) => void;
  validateUserSession: () => boolean | null;
  userRoleFromToken: () => string | null;
  handleSignOut: () => void;
  usernameFromToken: () => string;
  getAccessToken: () => string | null;
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
  getAccessToken: () => null
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
        const parseToken = JSON.parse(storedUser).accessToken;
        setAccessToken(parseToken);
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
        accessToken,
        getAccessToken,
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
