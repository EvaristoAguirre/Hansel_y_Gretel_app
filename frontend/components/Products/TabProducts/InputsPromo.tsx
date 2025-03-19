import { searchProducts } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import { ProductCreated, ProductForm, ProductForPromo, SelectedProductsI } from "@/components/Interfaces/IProducts";
import AutoCompleteProduct from "@/components/Utils/Autocomplete";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import { Delete, Edit, Save, Close } from "@mui/icons-material";
import { Button, IconButton, List, ListItem, ListItemText, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface InputsPromoProps {
  onSave: (productsForm: ProductForPromo[]) => void;
  form: ProductForm;
}

const InputsPromo: React.FC<InputsPromoProps> = ({ onSave, form }) => {
  const { getAccessToken } = useAuth();

  // Estado único para los productos seleccionados
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>([]);

  // Control de la edición: índice del producto en edición y su cantidad
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);

  // Resultado del buscador de productos
  const [searchProductsResults, setSearchProductsResults] = useState<ProductCreated[]>([]);

  useEffect(() => {
    if (form.products) {
      const preparedProducts = form.products.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitaryPrice: Number(item.product.price),
      }));
      setSelectedProducts(preparedProducts);
    }
  }, []);

  const handleSearch = async (value: string) => {
    const token = getAccessToken();
    if (value.trim() && token) {
      const results = await searchProducts(value, token);
      setSearchProductsResults(results);
    }
  };

  /**
   * Agrega un producto seleccionado al estado `selectedProducts`, pero solo si no está ya incluido.
   * Si el producto es nuevo, se agrega con una cantidad de 1 y su precio unitario.
   *
   * @param {ProductCreated} product - El producto a agregar
   */
  const handleSelectProduct = (product: ProductCreated) => {
    if (selectedProducts.some((p) => p.productId === product.id)) return;
    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitaryPrice: Number(product.price),
      },
    ]);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditQuantity(selectedProducts[index].quantity);
  };

  /**
   * Guarda los cambios realizados en la edición de un producto.
   * Actualiza la cantidad del producto en la lista de productos seleccionados.
   *
   * @notes Solo se ejecuta si hay un producto en edición (editIndex !== null)
   */
  const handleSaveEdit = () => {
    if (editIndex !== null) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[editIndex].quantity = editQuantity;
      setSelectedProducts(updatedProducts);
      setEditIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
  };


  /**
   * Elimina un producto de la lista de productos seleccionados.
   * Si el producto eliminado estaba siendo editado, se cancela la edición.
   *
   * @param {string} productId - El ID del producto a eliminar
   */
  const handleDelete = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
    if (editIndex !== null && selectedProducts[editIndex]?.productId === productId) {
      setEditIndex(null);
    }
  };

  /**
    Al guardar, transformamos selectedProducts al formato que espera el backend
   * 
   */
  const handleSaveProducts = () => {
    const productsForPromo: ProductForPromo[] = selectedProducts.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    onSave(productsForPromo);
  };

  return (
    <>
      <AutoCompleteProduct
        options={searchProductsResults}
        onSearch={handleSearch}
        onSelect={handleSelectProduct}
      />
      {selectedProducts.length > 0 ? (
        <List
          style={{
            maxHeight: "12rem",
            overflowY: "auto",
            border: "2px solid #856D5E",
            borderRadius: "5px",
            marginTop: "0.5rem",
          }}
        >
          {selectedProducts.map((item, index) => (
            <ListItem
              key={item.productId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "space-between",
              }}
            >
              {editIndex === index ? (
                <TextField
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                  type="number"
                  inputProps={{ min: 1 }}
                  size="small"
                  style={{ width: "4rem" }}
                />
              ) : (
                <Typography>{item.quantity}</Typography>
              )}

              <Tooltip title={item.productName} arrow>
                <ListItemText primary={capitalizeFirstLetter(item.productName)} />
              </Tooltip>
              <Typography>${(item.unitaryPrice * item.quantity).toFixed(2)}</Typography>

              {editIndex === index ? (
                <>
                  <IconButton onClick={handleSaveEdit}>
                    <Save color="success" />
                  </IconButton>
                  <IconButton onClick={handleCancelEdit}>
                    <Close color="error" />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => handleEdit(index)}>
                  <Edit color="primary" />
                </IconButton>
              )}

              <IconButton onClick={() => handleDelete(item.productId)}>
                <Delete color="error" />
              </IconButton>
            </ListItem>
          ))}
          <Button onClick={handleSaveProducts} color="primary" disabled={selectedProducts.length === 0}>
            Guardar
          </Button>
        </List>
      ) : (
        <Typography style={{ margin: "1rem 0", color: "gray", fontSize: "0.8rem" }}>
          No hay productos seleccionados.
        </Typography>
      )}
    </>
  );
};

export default InputsPromo;
