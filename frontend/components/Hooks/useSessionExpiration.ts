'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"; // Importación por defecto
import { useAuth } from "@/app/context/authContext";
import Swal from "sweetalert2";

export const useSessionExpiration = () => {
  const router = useRouter();
  const { getAccessToken, removeAccessToken } = useAuth(); // Asumiendo que tienes removeAccessToken en tu contexto
  const token = getAccessToken();

  useEffect(() => {
    if (!token) return;

    let timer: NodeJS.Timeout;

    try {
      const decoded: { exp: number } = jwtDecode(token);
      const expirationTime = decoded.exp * 1000 - Date.now(); // Milisegundos

      if (expirationTime > 0) {
        timer = setTimeout(() => {
          Swal.fire({
            icon: "warning",
            title: "Tu sesión ha expirado",
            text: "Por favor, inicia sesión nuevamente.",
          })
          // Elimina el token tanto del localStorage como del contexto, según convenga
          localStorage.removeItem("token");
          if (removeAccessToken) {
            removeAccessToken();
          }
          router.push("/login");
        }, expirationTime);
      } else {
        // Si el token ya expiró, notificar de inmediato
        Swal.fire({
          icon: "warning",
          title: "Tu sesión ha expirado",
          text: "Por favor, inicia sesión nuevamente.",
        })
        localStorage.removeItem("token");
        if (removeAccessToken) {
          removeAccessToken();
        }
        router.push("/login");
      }
    } catch (error) {
      // En caso de error al decodificar, asumir que el token es inválido o expiró
      alert("Ha ocurrido un error con tu sesión, por favor inicia sesión nuevamente.");
      localStorage.removeItem("token");
      if (removeAccessToken) {
        removeAccessToken();
      }
      router.push("/login");
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [token, router, removeAccessToken]);
};
