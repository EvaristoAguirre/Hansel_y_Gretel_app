import { searchProducts } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import { ProductCreated, ProductForm, ProductForPromo, SelectedProductsI } from "@/components/Interfaces/IProducts";
import AutoCompleteProduct from "@/components/Utils/Autocomplete";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import { Add, Delete, Edit, Remove, Save, Close } from "@mui/icons-material";
import { Button, IconButton, List, ListItem, ListItemText, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface InputsPromoProps {
  onSave: (productsForm: ProductForPromo[]) => void;
  form: ProductForm;
}

const InputsPromo: React.FC<InputsPromoProps> = ({ onSave, form }) => {
  const { getAccessToken } = useAuth();
  const [searchResults, setSearchResults] = useState<ProductCreated[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductsI[]>([]);
  const [productForForm, setProductForForm] = useState<ProductForPromo[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<{ id: string; quantity: number } | null>(null);

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
  }, [form.products]);

  const handleSearch = async (value: string) => {
    const token = getAccessToken();
    if (value.trim() && token) {
      const results = await searchProducts(value, token);
      setSearchResults(results);
    }
  };

  const handleSelectProduct = (product: ProductCreated) => {
    setSelectedProducts((prev) => [...prev, { productId: product.id, productName: product.name, quantity: 1, unitaryPrice: Number(product.price) }]);
    setProductForForm((prev) => [...prev, { productId: product.id, quantity: 1 }]);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditProduct({
      id: selectedProducts[index].productId,
      quantity: selectedProducts[index].quantity,
    });
  };

  const handleSaveEdit = () => {
    if (editIndex !== null && editProduct) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[editIndex].quantity = editProduct.quantity;
      setSelectedProducts(updatedProducts);

      const updatedFormProducts = productForForm.map((p) =>
        p.productId === editProduct.id ? { ...p, quantity: editProduct.quantity } : p
      );
      setProductForForm(updatedFormProducts);
    }
    setEditIndex(null);
    setEditProduct(null);
  };

  const handleDelete = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== id));
    setProductForForm(productForForm.filter((p) => p.productId !== id));
  };

  return (
    <>
      <AutoCompleteProduct options={searchResults} onSearch={handleSearch} onSelect={handleSelectProduct} />
      {selectedProducts.length > 0 ? (
        <List style={{ maxHeight: "12rem", overflowY: "auto", border: "2px solid #856D5E", borderRadius: "5px", marginTop: "0.5rem" }}>
          {selectedProducts.map((item, index) => (
            <ListItem key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
              {editIndex === index ? (
                <TextField
                  value={editProduct?.quantity || 1}
                  onChange={(e) => setEditProduct((prev) => (prev ? { ...prev, quantity: parseInt(e.target.value) || 1 } : null))}
                  type="number"
                  inputProps={{ min: 1 }}
                  size="small"
                />
              ) : (
                <Typography>{item.quantity}</Typography>
              )}

              <Tooltip title={item.productName} arrow>
                <ListItemText primary={capitalizeFirstLetter(item.productName)} />
              </Tooltip>
              <Typography>${item.unitaryPrice * item.quantity}</Typography>

              {editIndex === index ? (
                <>
                  <IconButton onClick={handleSaveEdit}><Save color="success" /></IconButton>
                  <IconButton onClick={() => setEditIndex(null)}><Close color="error" /></IconButton>
                </>
              ) : (
                <IconButton onClick={() => handleEdit(index)}><Edit color="primary" /></IconButton>
              )}

              <IconButton onClick={() => handleDelete(item.productId)}><Delete color="error" /></IconButton>
            </ListItem>
          ))}
          <Button onClick={() => onSave(productForForm)} color="primary" disabled={selectedProducts.length === 0}>Guardar</Button>
        </List>
      ) : (
        <Typography style={{ margin: "1rem 0", color: "gray", fontSize: "0.8rem" }}>No hay productos seleccionados.</Typography>
      )}
    </>
  );
};

export default InputsPromo;