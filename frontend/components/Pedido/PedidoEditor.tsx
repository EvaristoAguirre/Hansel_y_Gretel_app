import React from "react";
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
import { OrderCreated } from "./useOrderStore";
import usePedido from "../Hooks/usePedido";

const PedidoEditor = ({
  mesa,
  ordenAbierta,
}: {
  mesa: MesaInterface;
  ordenAbierta: OrderCreated;
}) => {
  const {
    productosDisponibles,
    productosSeleccionados,
    products,
    handleSeleccionarProducto,
    setProductosDisponibles,
    handleAgregarProductosAlPedido,
    removeOrder,
  } = usePedido();

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
            label="Buscar productos por nombre, código o categoría"
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
        // onClick={() => removeOrder(mesa.orderId!)}
      >
        Anular Pedido
      </Button>
    </div>
  );
};

export default PedidoEditor;
