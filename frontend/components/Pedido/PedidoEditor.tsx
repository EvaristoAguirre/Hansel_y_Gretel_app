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
  IconButton,
} from "@mui/material";
import { OrderCreated } from "./useOrderStore";
import usePedido from "../Hooks/usePedido";
import { Add, Remove, Delete, Print } from "@mui/icons-material";
import { Box } from "@mui/system";

const PedidoEditor = ({
  mesa,
  ordenAbierta,
}: {
  mesa: MesaInterface;
  ordenAbierta: OrderCreated;
}) => {
  const {
    productosDisponibles,
    productsDetails,
    products,
    setProductsDetails,
    handleSeleccionarProducto,
    setProductosDisponibles,
    handleEditOrder,
    // handleAgregarProductosAlPedido,
    handleDeleteOrder,
  } = usePedido();

  const [productosConfirmados, setProductosConfirmados] = useState<
    { productId: string; quantity: number; price: number; name: string }[]
  >([]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  const confirmarPedido = () => {
    // Crear un nuevo array combinando los productos confirmados con los nuevos detalles
    const productosActualizados = [...productosConfirmados];

    productsDetails.forEach((nuevoProducto) => {
      const productoExistente = productosActualizados.find(
        (p) => p.productId === nuevoProducto.productId
      );

      if (productoExistente) {
        // Si el producto ya existe, sumamos la cantidad
        productoExistente.quantity += nuevoProducto.quantity;
      } else {
        // Si no existe, lo agregamos
        productosActualizados.push(nuevoProducto);
      }
    });

    setProductosConfirmados(productosActualizados);
    handleEditOrder(ordenAbierta.id);
    setProductsDetails([]);
  };


  const eliminarProductoSeleccionado = (id: string) => {
    setProductsDetails(productsDetails.filter((p) => p.productId !== id));
  };
  const eliminarProductoConfirmado = (id: string) => {
    setProductosConfirmados(
      productosConfirmados.filter((p) => p.productId !== id)
    );
  };

  const imprimirComanda = () => {
    console.log("Imprimiendo comanda:", productosConfirmados);
    // Aquí podrías integrar la función de impresión
  };

  const aumentarCantidad = (id: string) => {
    setProductsDetails(
      productsDetails.map((p) =>
        p.productId === id ? { ...p, quantity: p.quantity + 1 } : p
      )
    );
  };

  const disminuirCantidad = (id: string) => {
    setProductsDetails(
      productsDetails.map((p) =>
        p.productId === id && p.quantity > 1
          ? { ...p, quantity: p.quantity - 1 }
          : p
      )
    );
  };

  const cancelarPedido = () => {
    setProductsDetails([]);
  };

  //Totales

  useEffect(() => {
    const calcularSubtotal = () => {
      setSubtotal(
        productsDetails.reduce((acc, item) => {
          return acc + item.price * item.quantity;
        }, 0)
      );
    };

    const calcularTotal = () => {
      setTotal(
        productosConfirmados.reduce((acc, item) => {
          return acc + item.price * item.quantity;
        }, 0)
      );
    };

    calcularSubtotal();
    calcularTotal();
  }, [productsDetails, productosConfirmados]);

  return (
    <div style={{ width: "100%", padding: "1rem", border: "1px solid #d4c0b3", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
      <h2
        style={{
          height: "3rem",
          fontSize: "1.2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "black",
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
        <h2>Armar Pedido</h2>
      </div>
      <Box
        sx={{ border: "1px solid #d4c0b3", borderRadius: "5px", padding: "1rem", boxShadow: "0px 1px 2px 3px rgba(0, 0, 0, 0.1)" }}
      >
        <Autocomplete

          options={productosDisponibles}
          getOptionLabel={(producto) =>
            `${producto.name} - $${producto.price} (Código: ${producto.code})`
          }
          onInputChange={(event, value) => {
            const searchTerm = value.toLowerCase();
            setProductosDisponibles(
              products.filter(
                (producto) =>
                  producto.name.toLowerCase().includes(searchTerm) ||
                  producto.code.toString().toLowerCase().includes(searchTerm)
              )
            );
          }}
          onChange={(event, selectedProducto) => {
            if (selectedProducto) {
              console.log("selectedProducto:", selectedProducto);
              handleSeleccionarProducto(selectedProducto);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar productos por nombre, código o categoría"
              variant="outlined"
              fullWidth
              sx={{ label: { color: "black", fontSize: "0.8rem" } }}
            />
          )}
        />


        {productsDetails.length > 0 ? (
          <List>
            {productsDetails.map((item, index) => (
              <ListItem
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  height: "2.3rem",
                  margin: "0.3rem 0",
                  color: "#ffffff",
                  borderBottom: "1px solid #856D5E",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconButton
                    onClick={() => disminuirCantidad(item.productId)}>
                    <Remove />
                  </IconButton>
                  <Typography
                    sx={{ border: "1px solid #856D5E", color: "#856D5E" }}
                    style={{
                      color: "black",
                      width: "2rem",
                      textAlign: "center",
                      borderRadius: "5px",
                    }}
                  >
                    {item.quantity}
                  </Typography>
                  <IconButton onClick={() => aumentarCantidad(item.productId)}>
                    <Add />
                  </IconButton>
                </div>
                <ListItemText style={{ color: "black" }} primary={item.name} />
                <Typography style={{ color: "black" }}>
                  ${item.price * item.quantity}
                </Typography>
                <IconButton
                  onClick={() => eliminarProductoSeleccionado(item.productId)}
                >
                  <Delete />
                </IconButton>
              </ListItem>
            ))}
            <Typography
              style={{
                width: "50%",
                margin: "1rem 0",
                color: "black",
                fontWeight: "bold",
              }}
            >
              Subtotal: ${subtotal}
            </Typography>

            {/* Botones de confirmar y cancelar */}

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <Button
                color="secondary"
                variant="contained"
                style={{ margin: "10px", backgroundColor: "#9d8a7e" }}
                onClick={cancelarPedido}
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                style={{ margin: "10px", backgroundColor: "#7e9d8a" }}
                onClick={confirmarPedido}
              >
                Confirmar
              </Button>

            </div>
          </List>
        ) : (
          <Typography style={{ margin: "1rem 0" }}>
            No hay productos seleccionados
          </Typography>
        )}
      </Box>

      {productosConfirmados.length > 0 && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <Typography>Productos Confirmados</Typography>
            <List>
              {productosConfirmados.map((item, index) => (
                <ListItem
                  key={index}
                  style={{
                    backgroundColor: "#eceae8",
                    margin: "0.3rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Typography
                    style={{
                      color: "black",
                      backgroundColor: "white",
                      width: "2rem",
                      textAlign: "center",
                      borderRadius: "5px",
                    }}
                  >
                    {item.quantity}
                  </Typography>
                  <ListItemText
                    style={{ margin: "0 1rem" }}
                    primary={item.name}
                  />
                  <Typography>{`$ ${item.price * item.quantity}`}</Typography>

                  <IconButton
                    onClick={() => eliminarProductoConfirmado(item.productId)}
                  >
                    <Delete />
                  </IconButton>
                </ListItem>
              ))}
              <Typography
                style={{
                  margin: "1rem 0",
                  backgroundColor: "#cce5ff",
                  width: "100%",
                  padding: "0.5rem",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Total: ${total}
              </Typography>
            </List>
          </div>
          <Button
            fullWidth
            color="secondary"
            variant="contained"
            style={{ marginTop: "10px" }}
            onClick={imprimirComanda}
          >
            <Print style={{ marginRight: "5px" }} /> Imprimir Comanda
          </Button>
        </>
      )}

      <Button
        fullWidth
        color="warning"
        variant="contained"
        style={{ marginTop: "10px" }}
        onClick={() => handleDeleteOrder(ordenAbierta.id)}
      >
        Anular Pedido
      </Button>

    </div>
  );
};

export default PedidoEditor;
