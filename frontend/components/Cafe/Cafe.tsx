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
import { useProductStore } from "../Producto/useProductStore";
import { URI_PRODUCT } from "../URI/URI";
import Mesa from "../Mesa/Mesa";
import Mesa_menu from "../Mesa/MesaDatos";
import Sala from "../Salas/Sala";
import { MesaInterface, MozoInterface } from "../Interfaces/Cafe_interfaces";



const Cafe = () => {

  
  // Zustand para manejar los productos
  const { products, setProducts, connectWebSocket } = useProductStore();

  // Cargar productos desde la base de datos (API)
  // const fetchProducts = async () => {
  //   try {
  //     const response = await fetch(URI_PRODUCT, { method: "GET" });
  //     if (!response.ok) throw new Error("Error al cargar productos");
  //     const data = await response.json();
  //     setProducts(data);
  //   } catch (error) {
  //     Swal.fire("Error", "No se pudieron cargar los productos.", "error");
  //     console.error(error);
  //   }
  // };

  // useEffect(() => {
  //   fetchProducts(); // Cargar productos al inicio
  //   connectWebSocket();
  // }, [setProducts, connectWebSocket]);

  // useEffect(() => {
  //   setProductosDisponibles(products); // Sincronizar productos disponibles
  // }, [products]);

  // Abrir editor de pedidos
  // const handleAbrirMesa = () => {
  //   fetchProducts(); // Asegurar que los productos están actualizados
  //   setMostrarEditorPedido(true);
  // };

  // Mostrar detalles del pedido
  

  // Manejar selección de productos
  // const handleSeleccionarProducto = (producto) => {
  //   // Comprobar si el producto ya está en el pedido
  //   const pedidoActual = selectedMesa.pedido || [];
  //   const productoExistente = pedidoActual.find((p) => p.id === producto.id);

  //   if (productoExistente) {
  //     // Incrementar la cantidad si ya existe
  //     productoExistente.cantidad += 1;
  //   } else {
  //     // Agregar nuevo producto al pedido
  //     pedidoActual.push({ ...producto, cantidad: 1 });
  //   }

  //   // Actualizar el estado de la mesa seleccionada
  //   setSelectedMesa((prevMesa) => ({
  //     ...prevMesa,
  //     pedido: [...pedidoActual],
  //   }));

  // Actualizar las mesas en el estado general
  //   setMesas((prevMesas) =>
  //     prevMesas.map((mesa) =>
  //       mesa.id === selectedMesa.id
  //         ? { ...selectedMesa, pedido: pedidoActual }
  //         : mesa
  //     )
  //   );
  // };

  // Agregar productos al pedido
  // const handleAgregarProductosAlPedido = () => {
  //   const mesaActualizada = {
  //     ...selectedMesa,
  //     pedido: [...(selectedMesa.pedido || []), ...productosSeleccionados],
  //   };

  //   setMesas((prevMesas) =>
  //     prevMesas.map((mesa) =>
  //       mesa.id === selectedMesa.id ? mesaActualizada : mesa
  //     )
  //   );

  //   setProductosSeleccionados([...productosSeleccionados]);
  //   Swal.fire(
  //     "Pedido Actualizado",
  //     `${productosSeleccionados.length} producto(s) añadido(s) al pedido.`,
  //     "success"
  //   );
  //   setMostrarEditorPedido(false);
  // };

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
