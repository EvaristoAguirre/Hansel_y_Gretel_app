"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.svg";
import cafe from "../../public/icons/coffe.png";
import products from "../../public/icons/products.png";
import clients from "../../public/icons/clients.png";
import proveedor from "../../public/icons/providers.jpeg";
import configuracion from "../../public/icons/settings.png";
import user from "../../public/user.svg";

const Navbar = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const sections = [
    { label: "Cafe", path: "/views/cafe", icon: cafe },
    { label: "Productos", path: "/views/products", icon: products },
    { label: "Clientes", path: "/views/clientes", icon: clients },
    { label: "Proveedores", path: "/views/proveedores", icon: proveedor },
    { label: "Configuración", path: "/views/configuracion", icon: configuracion },
  ];

  const sessionActions = [
    { label: "Nombre", path: "/", icon: user },
    { label: "Cerrar Sesión", path: "/" },
    { label: "Crear Usuario", path: "/" },
  ];

  return (
    <nav className="bg-black shadow-md ] py-4">
      <div className="flex justify-between items-center px-8 border-b-8 border-[#856D5E]">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image src={logo} alt="Logo Hansel y Gretel" width={100} height={100} />
          </Link>
        </div>

        {/* Sections */}
        <div className="flex gap-8 items-center">
          {sections.map((section) => (
            <Link key={section.label} href={section.path}>
              <div
                onClick={() => setSelectedSection(section.label)}
                className={`relative group cursor-pointer p-3 transition-colors ${
                  selectedSection === section.label ? "bg-[#856D5E]" : "bg-transparent"
                }`}
              >
                <Image
                  src={section.icon}
                  alt={`Logo pestaña ${section.label.toLowerCase()}`}
                  width={40}
                  height={40}
                  className="group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {section.label}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Session Actions */}
        <div className="flex items-center gap-4 text-white">
          {sessionActions.map((action) => (
            <div key={action.label} className="flex items-center gap-2">
              {action.icon && (
                <div className="border border-[#856D5E] rounded-md p-2 flex items-center">
                  <h3 className="text-sm font-medium mr-2">{action.label}</h3>
                  <Image
                    src={action.icon}
                    alt={`Icono de ${action.label.toLowerCase()}`}
                    width={20}
                    height={20}
                  />
                </div>
              )}
              {!action.icon && (
                <Link href={action.path} className="text-sm font-medium hover:underline">
                  {action.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
