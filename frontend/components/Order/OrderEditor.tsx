import React, { useEffect, useState } from "react";
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Add, Remove, Delete, Comment } from "@mui/icons-material";
import { Box } from "@mui/system";
import { useOrderContext } from "../../app/context/order.context";
import "../../styles/pedidoEditor.css";
import { useProducts } from "../Hooks/useProducts";
import useOrder from "../Hooks/useOrder";
import LoadingLottie from "../Loader/Loading";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";
import AutoGrowTextarea from "../Utils/Textarea";
import { fetchCategories } from "@/api/categories";
import { ICategory } from "../Interfaces/ICategories";
import { searchProducts } from "@/api/products";
import AutoCompleteProduct from "../Utils/Autocomplete";
import { CategorySelector } from "./filterCategories";
import { useAuth } from "@/app/context/authContext";

export interface Product {
  price: number;
  quantity: number;
  productId: string;
  name: string;
}

interface Props {
  handleNextStep: () => void;
  handleCompleteStep: () => void;
  handleBackStep: () => void;
  handleReset: () => void;
}
const OrderEditor = ({
  handleNextStep,
  handleBackStep,
  handleCompleteStep,
  handleReset,
}: Props) => {
  const { productosDisponibles, setProductosDisponibles } = useOrder();
  const { fetchAndSetProducts, products } = useProducts();
  const { getAccessToken } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    token && fetchAndSetProducts(token);
  }, []);

  const {
    handleCancelOrder,
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
    productComment,
    handleEditOrder,
  } = useOrderContext();

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visibleCommentInputs, setVisibleCommentInputs] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [categories, setCategories] = useState<ICategory[]>([]);
  // const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const token = getAccessToken();
  const [isPriority, setIsPriority] = useState<boolean>(false);

  useEffect(() => {
    token && fetchCategories(token).then((categories = []) => setCategories(categories));
  }, []);

  const confirmarPedido: () => Promise<void> = async () => {
    if (selectedOrderByTable) {
      setLoading(true);
      try {
        await handleEditOrder(
          selectedOrderByTable.id,
          selectedProducts,
          selectedOrderByTable.numberCustomers,
          selectedOrderByTable.comment,
          isPriority
        );
        setSelectedProducts([]);
        handleCompleteStep();
        handleNextStep();
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const calcularSubtotal = () => {
      setSubtotal(
        selectedProducts.reduce((acc, item) => {
          return acc + (item.unitaryPrice ?? 0) * item.quantity;
        }, 0)
      );
    };
    calcularSubtotal();

    const calculateTotal = () => {
      setTotal(
        confirmedProducts?.reduce((acc, item) => {
          return acc + (item.unitaryPrice ?? 0) * item.quantity;
        }, 0)
      );
    };
    calculateTotal();
  }, [selectedProducts, confirmedProducts]);

  const toggleCommentInput = (productId: string) => {
    setVisibleCommentInputs((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  /**
   *
   * @param productId - El ID del producto a eliminar
   * @returns La función `handleDeleteProductAndComment` elimina un producto del contexto y su comentario asociado en el estado local.
   * Si el producto eliminado estaba siendo editado, se cancela la edición.
   */
  const handleDeleteProductAndComment = (productId: string) => {
    handleDeleteSelectedProduct(productId)
    setCommentInputs((prevCommentInputs) => {
      const newCommentInputs = { ...prevCommentInputs };
      delete newCommentInputs[productId];
      return newCommentInputs;
    });
  };

  /**
   * Fracción de código para buscar productos en base a nombre,
   * código o categorías seleccionadas.
   */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const searchProductsFiltered = async (term: string, categories: string[]) => {
    const trimmedTerm = term.trim();
    const results = token && await searchProducts(trimmedTerm, token, categories.join(','));
    if (results) setProductosDisponibles(results);
  };

  const handleSearch = (value: string) => {
    const trimmedValue = value.trim();
    setSearchTerm(trimmedValue);
    searchProductsFiltered(trimmedValue, selectedCats);
  };

  useEffect(() => {
    searchProductsFiltered(searchTerm, selectedCats);
  }, [selectedCats]);

  const [showCategories, setShowCategories] = useState(false);

  const handleToggle = () => {
    setShowCategories((prev) => !prev);
  };

  return loading ? (
    <LoadingLottie />
  ) : (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #d4c0b3",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "1rem",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              height: "2rem",
              backgroundColor: "#856D5E",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#ffffff",
              marginBottom: "1rem",
            }}
          >
            <h2>Seleccionar productos</h2>
          </div>
          <Box sx={{ borderRadius: "5px" }}>
            <CategorySelector
              categories={categories}
              selected={selectedCats}
              onChangeSelected={setSelectedCats}
            />


            <AutoCompleteProduct
              options={productosDisponibles}
              onSearch={(value) => handleSearch(value)}
              onSelect={handleSelectedProducts}
            />

            {/* PRODUCTOS PRE-SELECCIONADOS */}
            {selectedProducts.length > 0 ? (
              <List
                className="custom-scrollbar"
                style={{
                  maxHeight: "16rem", // Más altura para que entren comentarios
                  overflowY: "auto",
                  border: "2px solid #856D5E",
                  borderRadius: "5px",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  padding: "0.5rem",
                }}
              >
                <div className="w-full flex items-center justify-start mb-2 text-[#856D5E]">
                  <h5>Productos sin confirmar:</h5>
                </div>

                {selectedProducts.map((item, index) => (
                  <ListItem
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      width: "100%",
                      borderBottom: "1px solid #856D5E",
                      paddingBottom: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {/* Línea principal de datos del producto */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#ffffff",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
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
                            maxWidth: "15rem",
                          }}
                          primary={capitalizeFirstLetter(item.productName)}
                        />
                      </Tooltip>

                      <Typography style={{ color: "black" }}>
                        ${(item.unitaryPrice ?? 0) * item.quantity}
                      </Typography>

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => toggleCommentInput(item.productId)}>
                          <Comment style={{ color: "#856D5E" }} />
                        </IconButton>
                        <IconButton onClick={() =>
                          handleDeleteProductAndComment(item.productId)}>
                          <Delete />
                        </IconButton>
                      </div>
                    </div>

                    {/* Comentario */}
                    {visibleCommentInputs[item.productId] && (
                      <div style={{ marginTop: "0.5rem", width: "100%" }}>
                        <AutoGrowTextarea
                          value={
                            commentInputs[item.productId] !== undefined
                              ? commentInputs[item.productId]
                              : item.commentOfProduct ?? ""
                          }
                          placeholder="Comentario al producto"
                          onChange={(value) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [item.productId]: value,
                            }))
                          }
                          onBlur={() =>
                            productComment(item.productId, commentInputs[item.productId] || "")
                          }
                        />
                      </div>
                    )}
                  </ListItem>
                ))}
              </List>

            ) : (
              <Typography
                style={{
                  margin: "1rem 0",
                  color: "gray",
                  fontSize: "0.8rem",
                  width: "100%",
                }}
              >
                No hay productos pre-seleccionados.
              </Typography>
            )}


            <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={isPriority}
                    onChange={(event) => setIsPriority(event.target.checked)}
                  />
                }
                label="Orden Prioritaria"
                style={{ fontSize: "0.8rem", color: `${isPriority ? "red" : "gray"}`, fontWeight: "bold" }}
              />
            </div>
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

            {confirmedProducts?.length > 0 ? (
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
                {confirmedProducts?.map((item, index) => (
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
                    <Tooltip title={item.quantity} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                          maxWidth: "5rem",
                        }}
                        primary={item.quantity}
                      />
                    </Tooltip>
                    <Tooltip title={item.productName} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                        }}
                        primary={item.productName}
                      />
                    </Tooltip>
                    <Typography style={{ color: "black" }}>
                      ${(item.unitaryPrice ?? 0) * item.quantity}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography
                style={{
                  margin: "1rem 0",
                  color: "gray",
                  fontSize: "0.8rem",
                  width: "100%",
                }}
              >
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
        </div>
      </div>
    </div>
  );
};

export default OrderEditor;
