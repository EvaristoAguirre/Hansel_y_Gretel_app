import React, { useEffect, useState } from "react";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import {
  Autocomplete,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useProductStore } from "../Hooks/useProductStore";
import { useOrderDetailsStore } from "./useOrderDetailsStore";
import Swal from "sweetalert2";
import { OrderCreated, useOrderStore } from "./useOrderStore";
import usePedido from "../Hooks/usePedido";
import { OrderDetailsCreated } from "./useOrderDetailsStore";

const PedidoEditor = ({ mesa, ordenAbierta }: { mesa: MesaInterface, ordenAbierta: OrderCreated }) => {
  const [mostrarEditorPedido, setMostrarEditorPedido] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface | null>(null);
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>(
    []
  );
  const { products } = useProductStore();
  const { orders, removeOrder, findOrderByTableId } = useOrderStore();
 
  const { orderId, pedidoForm, fetchOrderById } = usePedido();
  
 
  console.log("Mesa recibida en PedidoEditor:", mesa);

  // const handleVerPedido = () => {
  //   setMostrarEditorPedido(true);
  // };

  useEffect(() => {
    setProductosDisponibles(products); // Sincronizar productos disponibles
  }, [products]);

  // Manejar selección de productos
  const handleSeleccionarProducto = (producto: any) => {
    const productoExistente = productosSeleccionados.find(
      (p) => p.id === producto.id
    );

    if (productoExistente) {
      // Incrementar la cantidad si ya existe
      productoExistente.cantidad += 1;
      setProductosSeleccionados([...productosSeleccionados]);
    } else {
      // Agregar nuevo producto al pedido
      setProductosSeleccionados([
        ...productosSeleccionados,
        { ...producto, cantidad: 1 },
      ]);
    }
  };

  // Agregar productos al pedido
  const handleAgregarProductosAlPedido = () => {
    if (!selectedMesa) {
      Swal.fire(
        "Error",
        "Por favor, selecciona una mesa antes de agregar productos al pedido.",
        "error"
      );
      return;
    }

    const mesaActualizada = {
      ...selectedMesa,
      // pedido: [...(selectedMesa.pedido || []), ...productosSeleccionados],
    };

    Swal.fire(
      "Pedido Actualizado",
      `${productosSeleccionados.length} producto(s) añadido(s) al pedido.`,
      "success"
    );
    setProductosSeleccionados([]);
    setMostrarEditorPedido(false);
  };

  return (
    <div>
      <h2
        style={{
          height: "3rem",
          backgroundColor: "#856D5E",
          fontSize: "1.2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#ffffff",
          margin: "1rem 0",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        {mesa.name}
      </h2>
      <div
        style={{
          height: "2rem",
          backgroundColor: "#856D5E",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#ffffff",
          margin: "1rem 0",
        }}
      >
        <h2>Datos de la mesa</h2>
      </div>
      <div>
        <h3>Cantidad de personas: {ordenAbierta.numberCustomers}</h3>
        <h3>Comentario: {ordenAbierta?.comment}</h3>
      </div>
      <div
        style={{
          height: "2rem",
          backgroundColor: "#856D5E",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#ffffff",
          margin: "1rem 0",
        }}
      >
        <h2>Pedido</h2>
      </div>

      {/* Buscador de productos con dropdown */}
      <Autocomplete
        style={{ margin: "1rem 0" }}
        options={productosDisponibles}
        getOptionLabel={(producto) =>
          `${producto.name} - $${producto.price} (Código: ${producto.code})`
        }
        onInputChange={(event, value) => {
          const searchTerm = value.toLowerCase();
          setProductosDisponibles(
            products.filter((producto) =>
              producto.name.toLowerCase().includes(searchTerm)
            )
          );
        }}
        onChange={(event, selectedProducto) => {
          if (selectedProducto) {
            handleSeleccionarProducto(selectedProducto);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Buscar productos por nombre o código"
            variant="outlined"
            fullWidth
          />
        )}
        renderOption={(props, producto) => (
          <li {...props} key={producto.id}>
            {`${producto.name} - $${producto.price} (Código: ${producto.code})`}
          </li>
        )}
      />

      {/* Mostrar productos seleccionados en el pedido */}
      <h3>Productos a confirmar</h3>
      {productosSeleccionados.length > 0 ? (
        <List>
          {productosSeleccionados.map((item, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`${item.name} x${item.cantidad}`}
                secondary={`$${item.price * item.cantidad}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography style={{ margin: "1rem 0" }}>
          No hay productos seleccionados
        </Typography>
      )}

      {/* Botón para guardar el pedido */}
      <Button
        fullWidth
        color="primary"
        variant="contained"
        style={{ marginTop: "10px" }}
        onClick={handleAgregarProductosAlPedido}
      >
        Guardar Pedido
      </Button>
      <Button
        fullWidth
        color="warning"
        variant="contained"
        style={{ marginTop: "10px" }}
        onClick={() => removeOrder(mesa.orderId!)}
      >
        Anular Pedido
      </Button>
    </div>
  );
};

export default PedidoEditor;
