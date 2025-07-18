import { searchProductsNotProm } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import { ProductForm, ProductForPromo, ProductResponse, SelectedProductsI } from "@/components/Interfaces/IProducts";
import AutoCompleteProduct from "@/components/Utils/Autocomplete";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import { formatNumber } from "@/components/Utils/FormatNumber";
import { normalizeNumber } from "@/components/Utils/NormalizeNumber";
import { Delete, Edit, Save, Close } from "@mui/icons-material";
import { IconButton, List, ListItem, ListItemText, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Tab, TabProductKey } from '../../../Enums/view-products';

interface InputsPromoProps {
  onSave: (productsForm: ProductForPromo[]) => void;
  form: ProductForm;
  handleSetDisableTabs: (tabKeys: TabProductKey[]) => void
}

const InputsPromo: React.FC<InputsPromoProps> = ({ onSave, form, handleSetDisableTabs }) => {
  const { getAccessToken } = useAuth();

  // Estado único para los productos seleccionados
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>([]);

  // Control de la edición: índice del producto en edición y su cantidad
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);

  // Resultado del buscador de productos
  const [searchProductsResults, setSearchProductsResults] = useState<ProductResponse[]>([]);

  useEffect(() => {
    if (form.products && form.products.length > 0) {


      const formattedProducts = form.products.map((item) => ({
        productId: item.product && item.product.id,
        productName: item.product && item.product.name,
        quantity: item.quantity,
        unitaryPrice: item.product && item.product.price ? item.product.price.toString() as string : null,
      }));
      setSelectedProducts(formattedProducts);

    }
  }, []);

  // Auto-actualización: cada vez que cambie selectedProducts, actualizamos el formulario del padre.
  useEffect(() => {
    if (!selectedProducts.length) {
      handleSetDisableTabs([]);
    }
    const productsForPromo: ProductForPromo[] = selectedProducts.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    onSave(productsForPromo);
  }, [selectedProducts]);


  const handleSearch = async (value: string) => {
    const token = getAccessToken();
    if (value.trim() && token) {
      const results = await searchProductsNotProm(value, token);
      setSearchProductsResults(results);
    }
  };

  /**
   * Agrega un producto seleccionado al estado `selectedProducts`, pero solo si no está ya incluido.
   * Si el producto es nuevo, se agrega con una cantidad de 1 y su precio unitario.
   *
   * @param {ProductResponse} product - El producto a agregar
   */
  const handleSelectProduct = (product: ProductResponse) => {
    if (selectedProducts.some((p) => p.productId === product.id)) return;
    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitaryPrice: product.price,
      },
    ]);
    handleSetDisableTabs([TabProductKey.PRODUCT_WITH_INGREDIENT, TabProductKey.SIMPLE_PRODUCT]);
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
      // handleSetDisableTabs([TabProductKey.PRODUCT_WITH_INGREDIENT, TabProductKey.SIMPLE_PRODUCT]);
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
    <div className="mt-4">
      <div className="w-full">

        <AutoCompleteProduct
          options={searchProductsResults}
          onSearch={handleSearch}
          onSelect={handleSelectProduct}
        />
      </div>
      {selectedProducts.length > 0 ? (
        <List
          dense={true}
          style={{
            maxHeight: "10rem",
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
                justifyContent: "space-between",
                padding: "4px 8px",
              }}
            >
              {editIndex === index ? (
                <TextField
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                  type="number"
                  inputProps={{ min: 1 }}
                  size="small"
                  sx={{ width: "4rem", marginRight: "8px" }}
                />
              ) : (
                <Typography fontSize="1rem" sx={{ marginX: "18px" }}>{item.quantity}</Typography>
              )}

              <Tooltip title={item.productName} arrow>
                <ListItemText
                  primary={item.productName && capitalizeFirstLetter(item.productName)}
                  sx={{ typography: 'caption' }}
                />
              </Tooltip>

              {item.unitaryPrice !== undefined && item.unitaryPrice !== null && (
                <Typography fontSize="0.8rem">
                  ${formatNumber(normalizeNumber(item.unitaryPrice) * item.quantity)}
                </Typography>
              )}


              {editIndex === index ? (
                <>
                  <IconButton onClick={handleSaveEdit} size="small">
                    <Save color="success" fontSize="small" />
                  </IconButton>
                  <IconButton onClick={handleCancelEdit} size="small">
                    <Close color="error" fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => handleEdit(index)} size="small">
                  <Edit color="primary" fontSize="small" />
                </IconButton>
              )}

              <IconButton onClick={() => handleDelete(item.productId)} size="small">
                <Delete color="error" fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>

      ) : (
        <Typography style={{ margin: "1rem 0", color: "gray", fontSize: "0.8rem" }}>
          No hay productos seleccionados.
        </Typography>
      )}
    </div>
  );
};

export default InputsPromo;
