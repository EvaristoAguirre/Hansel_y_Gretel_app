"use client";
import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import logo from "../../public/logo.png";
import cafeSvg from "../../public/cafe.svg";
import cafePng from "../../public/cafe.png";
import producto from "../../public/producto.png";
import cliente from "../../public/cliente.png";
import proveedor from "../../public/proveedor.png";
import configuracion from "../../public/configuracion.png";
import user from "../../public/user.svg";

const Navbar = () => {
  

  return (
    <nav>
      <div
        className="w-5/7"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div className="logo">
          <Image
            src={logo}
            alt="Logo Hansel y Gretel"
            style={{
              width: "40px",
              height: "40px",
              margin: "10px 30px",
            }}
          ></Image>
        </div>
        <div
          className="secciones"
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <a
            href="#"
            style={{
              margin: "0",
              width: "100px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            
          >
            <div
              id="icono"
              style={{
                width: "100px",
                height: "60px",
              }}
            >
              <Image
                src={cafeSvg}
                width={0}
                height={0}
                alt="Logo pestaña café"
                style={{ margin: "10px 30px", width: "3rem" }}
              ></Image>
            </div>
          </a>
          <a
            href=""
            style={{
              margin: "0",
              width: "100px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              id="icono"
              style={{
                width: "100px",
                height: "60px",
                backgroundColor: "#856D5E",
              }}
            >
              <Image
                src={producto}
                alt="Logo pestaña producto"
                style={{
                  margin: "10px 30px",
                }}
              ></Image>
            </div>
          </a>
          <a
            href=""
            style={{
              margin: "0",
              width: "100px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              id="icono"
              style={{
                width: "100px",
                height: "60px",
              }}
            >
              <Image
                src={cliente}
                alt="Logo pestaña cliente"
                style={{ margin: "10px 30px" }}
              ></Image>
            </div>
          </a>
          <a
            href=""
            style={{
              margin: "0",
              width: "100px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              id="icono"
              style={{
                width: "100px",
                height: "60px",
              }}
            >
              <Image
                src={proveedor}
                alt="Logo pestaña proveedor"
                style={{ margin: "10px 30px" }}
              ></Image>
            </div>
          </a>
          <a
            href=""
            style={{
              margin: "0",
              width: "100px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              id="icono"
              style={{
                width: "100px",
                height: "60px",
              }}
            >
              <Image
                src={configuracion}
                alt="Logo pestaña configuración"
                style={{ margin: "10px 30px" }}
              ></Image>
            </div>
          </a>
        </div>
        <div
          className="sesion"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 10px",
          }}
        >
          <div
            style={{
              border: "1px solid #856D5E",
              borderRadius: "10px",
              height: "70%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: "1px 5px",
              margin: "0 10px",
            }}
          >
            <h3>Nombre</h3>
            <Image
              src={user}
              alt="Logo usuario"
              style={{
                width: "20px",
                height: "20px",
                margin: "0px 5px",
              }}
            ></Image>
          </div>
          <a
            href="#"
            style={{
              margin: "0 10px",
            }}
          >
            Cerrar sesión
          </a>
          <a
            href="#"
            style={{
              margin: "0 10px",
            }}
          >
            Crear usuario
          </a>
        </div>
      </div>
      <div style={{ height: "10px", backgroundColor: "#856D5E" }}></div>
    </nav>
  );
};

export default Navbar;
