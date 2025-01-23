"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Autocomplete,
} from "@mui/material";
import Swal from "sweetalert2";
import { useProductStore } from "../Hooks/useProductStore";
import { URI_PRODUCT } from "../URI/URI";
import Mesa from "../Mesa/Mesa";
import Mesa_menu from "../Mesa/MesaDatos";
import Sala from "../Salas/Sala";
import { MesaInterface, MozoInterface } from "../Interfaces/Cafe_interfaces";



const Cafe = () => {

  
  // Zustand para manejar los productos
  const { products, setProducts, connectWebSocket } = useProductStore();

  // Manejar selección de mozo
  // const handleSeleccionarMozo = (mozoSeleccionado) => {
  //   setSelectedMesa((prevMesa) => ({
  //     ...prevMesa,
  //     mozo: mozoSeleccionado,
  //   }));
  // };

  // const handleAgregarMozoALaMesa = () => {
  //   const mesaActualizada = {
  //     ...selectedMesa,
  //     mozo: mozoSeleccionado,
  //   };

  //   setMesas((prevMesas) =>
  //     prevMesas.map((mesa) =>
  //       mesa.id === selectedMesa.id ? mesaActualizada : mesa
  //     )
  //   );
  // };

  // Operación de subtotal y total
  // const sumaSubtotal = () => {
  //   const subtotal = selectedMesa.pedido.reduce((acumulador, item) => {
  //     return acumulador + item.price;
  //   }, 0);

  //   return subtotal;
  // };

  return (
    <div className="cafe" style={{ display: "flex", height: "100vh" }}>
      {/* Lista de mesas */}
      <div className="salas-y-mesas" style={{ width: "100%", padding: "20px" }}>
        <Sala></Sala>
       
      </div>

      {/* <Mesa_menu></Mesa_menu> */}
    </div>
  );
};

export default Cafe;
