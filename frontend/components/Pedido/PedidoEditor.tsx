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
  Tooltip,
} from "@mui/material";
import { OrderCreated } from "./useOrderStore";
import usePedido from "../Hooks/usePedido";
import { Add, Remove, Delete } from "@mui/icons-material";
import { Box } from "@mui/system";
import "../../styles/pedidoEditor.css";

export interface Product {
  price: number;
  quantity: number;
  productId: string;
  name: string;
}
const PedidoEditor = ({
  mesa,
  ordenAbierta,
  setProductosConfirmados,
  productosConfirmados,
  handleNext
}: {
  mesa: MesaInterface;
  ordenAbierta: OrderCreated;
  setProductosConfirmados: any;
  productosConfirmados: any;
  handleNext: any;
}) => {

  const {
    productosDisponibles,
    productsDetails,
    products,
    setProductsDetails,
    handleSeleccionarProducto,
    setProductosDisponibles,
    handleEditOrder
  } = usePedido();





  const [subtotal, setSubtotal] = useState(0);

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
    handleNext();
  };


  const eliminarProductoSeleccionado = (id: string) => {
    setProductsDetails(productsDetails.filter((p) => p.productId !== id));
  };
  // const eliminarProductoConfirmado = (id: string) => {
  //   setProductosConfirmados(
  //     productosConfirmados.filter((p: Product) => p.productId !== id)
  //   );
  // };

  // const imprimirComanda = () => {
  //   console.log("Imprimiendo comanda:", productosConfirmados);
  //   // Aquí podrías integrar la función de impresión
  // };

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

    calcularSubtotal();

  }, [productsDetails]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>

      <div style={{
        width: "100%", display: "flex",
        flexDirection: "row", gap: "2rem",

      }}>

        <div style={{
          width: "100%", display: "flex",
          flexDirection: "column", border: "1px solid #d4c0b3",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", padding: "1rem",
          justifyContent: "space-between"
        }}>
          <div
            style={{
              height: "2rem",
              backgroundColor: "#856D5E",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#ffffff",
              marginBottom: "1rem"
            }}
          >
            <h2>Seleccionar productos</h2>
          </div>
          <Box
            sx={{ borderRadius: "5px" }}
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
                  sx={{ label: { color: "black", fontSize: "1rem" } }}
                />
              )}
            />
            {/* //Todo-- 👆🏽 ¿Este buscador está bien que diga que busca por categoria? */}

            {/* PRODUCTOS PRE-SELECCIONADOS */}
            {productsDetails.length > 0 ? (
              <List
                className="custom-scrollbar"
                style={{
                  maxHeight: "12rem",
                  overflowY: "auto",
                  border: "2px solid #856D5E",
                  borderRadius: "5px",
                  marginTop: "0.5rem",
                }}
              >
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
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <IconButton onClick={() => disminuirCantidad(item.productId)}>
                        <Remove color="error" />
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
                        <Add color="success" />
                      </IconButton>
                    </div>
                    <Tooltip title={item.name} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                          maxWidth: "5rem",
                        }}
                        primary={item.name}
                      />
                    </Tooltip>
                    <Typography style={{ color: "black" }}>
                      ${item.price * item.quantity}
                    </Typography>
                    <IconButton onClick={() => eliminarProductoSeleccionado(item.productId)}>
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}


              </List>
            ) : (
              <Typography style={{ margin: "1rem 0", color: "gray", fontSize: "0.8rem", width: "100%" }}>
                No hay productos pre-seleccionados.
              </Typography>
            )}
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

          </Box>
          {/* Botones de confirmar y cancelar */}
          <div>
            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#7e9d8a",
                "&:hover": { backgroundColor: "#f9b32d", color: "black" },
              }}
              onClick={confirmarPedido}
            >
              Confirmar Pedido
            </Button>
            {
              productosConfirmados.length > 0 &&
              <Button
                fullWidth
                color="error"
                variant="outlined"
                style={{ marginTop: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                onClick={cancelarPedido}
              >
                Cancelar Pedido
              </Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoEditor;
