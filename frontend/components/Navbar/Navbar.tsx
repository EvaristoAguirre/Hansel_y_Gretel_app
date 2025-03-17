"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.svg";
import cafe from "../../public/icons/coffe.png";
import products from "../../public/icons/products.png";
import clients from "../../public/icons/clients.png";
import proveedor from "../../public/icons/providers.jpeg";
import configuracion from "../../public/icons/settings.png";
import user from "../../public/user.svg";
import { useAuth } from "@/app/context/authContext";
import { UserRole } from "../Enums/user";

const Navbar = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showUsername, setShowUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú móvil

  const { usernameFromToken, handleSignOut, userRoleFromToken } = useAuth();

  useEffect(() => {
    const username = usernameFromToken();
    const userRole = userRoleFromToken();

    if (username) {
      setShowUsername(username);
      setUserRole(userRole);
    }
  }, []);

  const sections = [
    { label: "Cafe", path: "/views/cafe", icon: cafe },
    { label: "Productos", path: "/views/products", icon: products },
    { label: "Clientes", path: "/views/clientes", icon: clients },
    { label: "Proveedores", path: "/views/proveedores", icon: proveedor },
    { label: "Configuración", path: "/views/configuracion", icon: configuracion },
  ];

  const filteredSections = sections.filter(
    (section) => !(userRole === UserRole.MOZO && section.label === "Productos")
  );

  return (
    <nav className="bg-black shadow-md py-4 absolute top-0 left-0 right-0 z-50 w-full">
      <div className="flex justify-between items-center px-8 border-b-8 border-[#856D5E]">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image src={logo} alt="Logo Hansel y Gretel" width={100} height={100} />
          </Link>
        </div>

        {/* Menú de secciones para pantallas grandes */}
        <div className="hidden lg:flex gap-8 items-center">
          {filteredSections.map((section) => (
            <Link key={section.label} href={section.path}>
              <div
                onClick={() => setSelectedSection(section.label)}
                className={`relative group cursor-pointer p-3 transition-colors 
                ${selectedSection === section.label ? "bg-[#856D5E] rounded-t-md" : "bg-transparent"
                  }`}
              >
                <Image
                  src={section.icon}
                  alt={`Logo pestaña ${section.label.toLowerCase()}`}
                  width={40}
                  height={40}
                  className="group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-[-30px] left-1/2 transform
                 -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 
                 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {section.label}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Botón de menú para pantallas pequeñas */}
        <button
          className="lg:hidden text-white focus:outline-none text-3xl hover:scale-105 transition-transform"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        {/* Sesión de usuario */}
        <div className="flex items-center gap-4 text-white">
          <Link href={showUsername ? "/" : "/views/login"}>
            <div className="flex items-center gap-2 hover:scale-105 transition-transform">
              <button className="border border-[#856D5E] rounded-md p-2 flex items-center">
                <h3 className="text-sm font-medium mr-2">{showUsername || "Iniciar sesión"}</h3>
                <Image src={user} alt="Icono usuario" width={20} height={20} />
              </button>
            </div>
          </Link>
          {(userRole === "Admin" || userRole === "Encargado") && (
            <Link href="/views/register">
              <button className="border border-green-500 text-green-500 
              rounded-md p-2 text-sm font-medium hover:bg-green-500 
              hover:text-white transition-colors">
                Crear Usuario
              </button>
            </Link>
          )}
          {showUsername && (
            <button
              onClick={handleSignOut}
              className="border border-red-500 text-red-500 rounded-md p-2 
              text-sm font-medium hover:bg-red-500 hover:text-white 
              transition-colors"
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Menú desplegable para pantallas pequeñas */}
      {isMenuOpen && (
        <div className="lg:hidden bg-gray-900 text-white py-4">
          {sections.map((section) => (
            <Link key={section.label} href={section.path}>
              <div
                onClick={() => {
                  setSelectedSection(section.label);
                  setIsMenuOpen(false);
                }}
                className={`p-3 transition-colors ${selectedSection === section.label ? "bg-[#856D5E]" : "bg-transparent"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Image src={section.icon} alt={section.label} width={30} height={30} />
                  <span>{section.label}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
