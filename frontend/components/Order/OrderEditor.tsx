import React, { useEffect, useState } from "react";
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
import usePedido from "../Hooks/usePedido";
import { Add, Remove, Delete } from "@mui/icons-material";
import { Box } from "@mui/system";
import { useOrderContext } from '../../app/context/order.context';
import "../../styles/pedidoEditor.css";
import { deleteOrder } from "@/api/order";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/authContext";

export interface Product {
  price: number;
  quantity: number;
  productId: string;
  name: string;
};

interface Props {
  handleNextStep: () => void;
  handleCompleteStep: () => void;

}
const useOrderDetailsStore = ({
  handleNextStep,
  handleCompleteStep
}: Props) => {

  const {
    productosDisponibles,
    products,
    setProductosDisponibles,
  } = usePedido();

  const {
    selectedProducts,
    setSelectedProducts,
    confirmedProducts,
    setConfirmedProducts,
    selectedOrderByTable,
    setSelectedOrderByTable,
    handleSelectedProducts,
    handleDeleteSelectedProduct,
    increaseProductNumber,
    decreaseProductNumber,
    handleEditOrder
  } = useOrderContext();

  const { getAccessToken } = useAuth();



  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  const confirmarPedido = () => {
    if (selectedOrderByTable) {
      handleEditOrder(selectedOrderByTable.id, selectedProducts, selectedOrderByTable.numberCustomers, selectedOrderByTable.comment);
      setSelectedProducts([]);
      handleCompleteStep();
      handleNextStep();
    }
  };


  useEffect(() => {
    const calcularSubtotal = () => {
      setSubtotal(
        selectedProducts.reduce((acc, item) => {
          return acc + item.unitaryPrice * item.quantity;
        }, 0)
      );
    };
    calcularSubtotal();

    const calculateTotal = () => {
      setTotal(
        confirmedProducts.reduce((acc, item) => {
          return acc + item.unitaryPrice * item.quantity;
        }, 0)
      );
    };
    calculateTotal();

  }, [selectedProducts, confirmedProducts]);

  const handleDeleteOrder = async (orderId: string) => {
    const token = getAccessToken();
    if (!token) return;
    const deletedOrder = await deleteOrder(orderId, token);
    if (deletedOrder) {
      setSelectedOrderByTable(null);
    }

    setConfirmedProducts([]);

    Swal.fire({
      icon: "success",
      title: "Pedido Eliminado",
      text: "El pedido ha sido eliminado con éxito.",
    });
  };

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
              onInputChange={(event, value, reason) => {
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
                  handleSelectedProducts(selectedProducto);
                }
              }}

              renderInput={(params) => (
                <TextField
                  {...params}

                  label="Buscar productos por nombre o código"
                  variant="outlined"
                  fullWidth
                  sx={{ label: { color: "black", fontSize: "1rem" } }}
                />
              )}
            />

            {/* PRODUCTOS PRE-SELECCIONADOS */}
            {selectedProducts.length > 0 ? (
              <List
                className="custom-scrollbar"
                style={{
                  maxHeight: "12rem",
                  overflowY: "auto",
                  border: "2px solid #856D5E",
                  borderRadius: "5px",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                <div
                  className="w-2/4flex items-center 
                  justify-start m-2 text-[#856D5E]"
                >
                  <h5>Productos sin confirmar:</h5>
                </div>
                {selectedProducts.map((item, index) => (
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
                      <IconButton onClick={() => decreaseProductNumber(item.productId)}>
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
                      <IconButton onClick={() => increaseProductNumber(item.productId)}>
                        <Add color="success" />
                      </IconButton>
                    </div>
                    <Tooltip title={item.productName} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                          maxWidth: "5rem",
                        }}
                        primary={item.productName}
                      />
                    </Tooltip>
                    <Typography style={{ color: "black" }}>
                      ${item.unitaryPrice * item.quantity}
                    </Typography>
                    <IconButton onClick={() => handleDeleteSelectedProduct(item.productId)}>
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

            <div>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: "#f9b32d",
                  filter: "brightness(90%)",
                  color: "black",
                  "&:hover": { filter: "none", color: "black" },
                }}
                onClick={confirmarPedido}
              >
                CONFIRMAR PRODUCTOS A COMANDA
              </Button>
            </div>

            {/* PRODUCTOS confirmados */}

            {confirmedProducts.length > 0 ? (
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
                <div
                  className="w-2/4flex items-center 
                  justify-start m-2 text-[#856D5E]"
                >
                  <h5>Productos confirmados:</h5>
                </div>
                {confirmedProducts.map((item, index) => (
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
                    <Tooltip title={item.productName} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                          maxWidth: "5rem",
                        }}
                        primary={item.productName}
                      />
                    </Tooltip>
                    <Typography style={{ color: "black" }}>
                      ${item.unitaryPrice * item.quantity}
                    </Typography>
                    <IconButton onClick={() => handleDeleteSelectedProduct(item.productId)}>
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}


              </List>
            ) : (
              <Typography style={{ margin: "1rem 0", color: "gray", fontSize: "0.8rem", width: "100%" }}>
                No hay productos confirmados.
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
              Total: ${total}
            </Typography>
          </Box>
          {/* Botones de confirmar y cancelar */}
          <div>
            {/* <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#7e9d8a",
                "&:hover": { backgroundColor: "#f9b32d", color: "black" },
              }}
              onClick={confirmarPedido}
            >
              CONFIRMAR PRODUCTOS A COMANDA
            </Button> */}
            {
              confirmedProducts.length > 0 && selectedOrderByTable &&
              <Button
                fullWidth
                color="error"
                variant="outlined"
                style={{ marginTop: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                onClick={
                  () => handleDeleteOrder(selectedOrderByTable.id)

                }
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

export default useOrderDetailsStore;
function setInputValue(arg0: string) {
  throw new Error("Function not implemented.");
}

