'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "jwt-decode";

interface AuthContextProps {
  user: any;
  setUser: (user: any) => void;
  validateUserSession: () => boolean | null;
  userRoleFromToken: () => string | null;
  handleSignOut: () => void;
  usernameFromToken: () => string | null;
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
  usernameFromToken: () => null
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const userRoleFromToken = useCallback(() => {
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

  const usernameFromToken = useCallback(() => {
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
      return decodedToken.username;

    } catch (error) {
      console.error("Failed to decode token", error);
      return null;
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
        usernameFromToken
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
