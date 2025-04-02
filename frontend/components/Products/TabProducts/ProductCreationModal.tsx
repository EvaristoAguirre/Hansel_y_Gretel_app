import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  Autocomplete,
  Chip,
  DialogActions,
} from "@mui/material";
import Grid from '@mui/material/Grid';
import {
  ProductCreated,
  ProductForm,
  ProductForPromo,
} from "@/components/Interfaces/IProducts";
import { ICategory } from "@/components/Interfaces/ICategories";
import { FormTypeProduct, TabProductKey, TypeProduct } from "@/components/Enums/view-products";
import { getProductByCode, getProductByName } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import { IingredientForm } from "@/components/Interfaces/Ingredients";
import IngredientDialog from "./IngredientDialog";
import InputsPromo from "./InputsPromo";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";

interface ProductCreationModalProps {
  open: boolean;
  form: ProductForm;
  categories: ICategory[];
  onClose: () => void;
  onChange: (
    field: keyof ProductForm,
    value:
      | string
      | number
      | null
      | string[]
      | IingredientForm[]
      | ProductForPromo[]
  ) => void;
  onSave: () => void;
  modalType: FormTypeProduct;
  products: ProductCreated[];
  units: IUnitOfMeasureForm[]
}

interface Errors {
  [clave: string]: string;
}

const ProductCreationModal: React.FC<ProductCreationModalProps> = ({
  open,
  onClose,
  form,
  categories,
  onChange,
  onSave,
  modalType,
  products,
  units
}) => {
  /**
   * Estado que almacena el valor actual de la pestaña seleccionada.
   * Se inicializa en función del tipo de formulario y la modalidad de edición.
   * Si se está editando un producto de tipo PROMO, se selecciona la pestaña 2 por defecto.
   *
   * @initialValue PRODUCTO SIMPLE
   */
  const [tabValue, setTabValue] = useState<TabProductKey>(TabProductKey.SIMPLE_PRODUCT);
  const [disableTabs, setDisableTabs] = useState<TabProductKey[]>(
    // [TabProductKey.SIMPLE_PRODUCT, TabProductKey.PRODUCT_WITH_INGREDIENT, TabProductKey.PROMO]
    []
  );

  useEffect(() => {
    if (modalType === FormTypeProduct.EDIT) {
      if (form.type === TypeProduct.PROMO) {
        setTabValue(TabProductKey.PROMO);
      } else if (form.type === TypeProduct.PRODUCT && form.ingredients.length > 0) {
        setTabValue(TabProductKey.PRODUCT_WITH_INGREDIENT);
      } else {
        setTabValue(TabProductKey.SIMPLE_PRODUCT);
      }
    }
  }, [modalType, form.type, form.ingredients]);

  const [errors, setErrors] = useState<Errors>({
    code: "",
    name: "",
    price: "",
    cost: "",
    categories: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const { getAccessToken } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);
  }, [getAccessToken]);

  const fieldLabels: Record<keyof ProductForm, string> = {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    price: "Precio",
    cost: "Costo",
    categories: "Categoría",
    ingredients: "Ingredientes",
    isActive: "Inactivo",
    id: "ID",
  };

  const validateField = async (field: string, value: any) => {
    let error = "";

    if (field === "categories" && Array.isArray(value) && value.length === 0) {
      error = "Debe seleccionar al menos una categoría";
    }
    if (["code", "name", "price", "cost"].includes(field)) {
      if (!value) {
        error = "Este campo es obligatorio";
      } else if (field === "code") {
        // Validación del código
        setIsCheckingCode(true);
        try {
          if (token) {
            const result = await getProductByCode(value, token);
            if (result.ok) {
              error = "El código ya está en uso";
            } else if (result.status === 404) {
              error = "";
            } else {
              error = result.error || "Error al validar el código";
            }
          }

        } catch (err) {
          console.error("Error al validar el código:", err);
          error = "Error al conectar con el servidor";
        } finally {
          setIsCheckingCode(false);
        }
      } else if ((field === "price" || field === "cost") && value <= 0) {
        error = "Debe ser un número positivo";

      } else if (field === "name") {
        // Validación del nombre
        if (token) {
          const result = await getProductByName(value, token);
          if (result.ok) {
            error = "El nombre ya está en uso";
          } else if (result.status === 404) {
            error = "";
          } else {
            error = result.error || "Error al validar el nombre";
          }
        }
      }
      setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    };
  };

  const validateForm = () => {
    const hasErrors = Object.values(errors).some((error) => error);
    const hasEmptyFields =
      ["code", "name", "price", "cost"].some(
        (field) => !form[field as keyof ProductForm]
      ) ||
      !Array.isArray(form.categories) ||
      form.categories.length === 0;

    setIsFormValid(!hasErrors && !hasEmptyFields);
  };

  useEffect(() => {
    validateForm();
  }, [errors, form]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabProductKey) => {
    setTabValue(newValue);
    if (newValue === TabProductKey.PROMO && form.type !== TypeProduct.PROMO) {
      onChange("type", TypeProduct.PROMO);
    } else if (newValue !== TabProductKey.PROMO && form.type === TypeProduct.PROMO) {
      onChange("type", TypeProduct.PRODUCT);
    }
  };

  const handleSaveIngredients = (ingredientsForm: IingredientForm[]) => {
    onChange("ingredients", ingredientsForm);
  };
  const handleProductsPromo = (productsForm: ProductForPromo[]) => {
    onChange("products", productsForm);
  };

  const handleSaveProduct = () => {
    onSave();
    onClose();
  };

  const handleSetDisableTabs = (newDisableTabs: TabProductKey[]) => {
    // return setDisableTabs(disableTabs.filter(tab => tab !== tabKey));
    return setDisableTabs(newDisableTabs);

  }

  const onDisableTabs = (tabKey: TabProductKey) => {
    if (modalType === FormTypeProduct.EDIT) {
      switch (tabKey) {
        case TabProductKey.SIMPLE_PRODUCT:
          return form.type === TypeProduct.PROMO || form.ingredients.length > 0;

        case TabProductKey.PRODUCT_WITH_INGREDIENT:
          return (form.type === TypeProduct.PRODUCT && !form.ingredients.length) || form.type === TypeProduct.PROMO;

        case TabProductKey.PROMO:
          return form.type !== TypeProduct.PROMO;

        default:
          return false;

      }
    } else {
      return disableTabs.includes(tabKey);
    }
  };

  const getButtonText = () => {
    if (modalType === FormTypeProduct.CREATE) {
      return form.type === TypeProduct.PRODUCT ? "Crear producto" : "Crear promo";
    }
    if (modalType === FormTypeProduct.EDIT) {
      return form.type === TypeProduct.PRODUCT ? "Guardar producto" : "Guardar promo";
    }
    return "Guardar producto";
  };

  const fieldsToRender = ["name", "code", "price"];

  if (tabValue === TabProductKey.SIMPLE_PRODUCT) {
    fieldsToRender.push("cost");
  }


  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ width: 600, bgcolor: "background.paper", p: 4, mx: "auto", mt: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            label="Producto simple"
            value={TabProductKey.SIMPLE_PRODUCT}
            disabled={onDisableTabs(TabProductKey.SIMPLE_PRODUCT)}
          />
          <Tab
            label="Producto con ingredientes"
            value={TabProductKey.PRODUCT_WITH_INGREDIENT}
            disabled={onDisableTabs(TabProductKey.PRODUCT_WITH_INGREDIENT)}
          />
          <Tab
            label="Promo"
            value={TabProductKey.PROMO}
            disabled={onDisableTabs(TabProductKey.PROMO)}
          />
        </Tabs>
        <Grid container spacing={1} mt={1}>
          {fieldsToRender.map((field, index) => (
            <Grid item xs={12} sm={6} key={field}>
              <TextField
                fullWidth
                label={fieldLabels[field]}
                type={field === "price" || field === "cost" ? "number" : "text"}
                inputProps={{
                  onKeyDown: (e) => {
                    if (
                      (field === "price" || field === "cost") &&
                      (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-")
                    ) {
                      e.preventDefault();
                    }
                  },
                }}
                value={form[field] ?? ""}
                onChange={(e) => {
                  const value = ["price", "cost"].includes(field)
                    ? e.target.value === ""
                      ? null
                      : parseFloat(e.target.value)
                    : ["code"].includes(field)
                      ? e.target.value === ""
                        ? null
                        : parseInt(e.target.value, 10)
                      : e.target.value;
                  onChange(field as keyof ProductForm, value);
                  if (field !== "code") {
                    validateField(field, value);
                  }
                }}
                onBlur={(e) => {
                  if (field === "code") {
                    validateField(field, e.target.value);
                  }
                }}
                error={!!errors[field as keyof ProductForm]}
                helperText={
                  isCheckingCode && field === "code"
                    ? "Verificando código..."
                    : errors[field as keyof ProductForm]
                } variant="outlined"
                size="small"

              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              minRows={2}
              value={form.description ?? ""}
              onChange={(e) => onChange("description", e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} mt={1}>
            <FormControl fullWidth>
              <Autocomplete
                multiple
                options={categories}
                getOptionLabel={(option) => option.name}
                value={categories.filter((category) => category.id && form.categories.includes(category.id))}
                onChange={(_, newValue) => {
                  const selectedIds = newValue.map((category) => category.id);
                  onChange("categories", selectedIds.map((id) => id || ""));
                }}
                renderInput={(params) => <TextField {...params} label="Categorías" variant="outlined" placeholder="Selecciona categorías" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip {...getTagProps({ index })} key={option.id} label={option.name} sx={{ backgroundColor: "#f3d49ab8", color: "black", fontWeight: "bold" }} />
                  ))
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                size="small"
              />
            </FormControl>
          </Grid>
        </Grid>

        {tabValue === TabProductKey.PRODUCT_WITH_INGREDIENT && <IngredientDialog onSave={handleSaveIngredients} form={form} units={units} handleSetDisableTabs={handleSetDisableTabs} />}
        {tabValue === TabProductKey.PROMO && <InputsPromo onSave={handleProductsPromo} form={form} handleSetDisableTabs={handleSetDisableTabs} />}

        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button sx={{ mt: 2 }} onClick={() => {
            onClose();
          }} color="warning">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveProduct} sx={{ mt: 2 }}>
            {getButtonText()}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default ProductCreationModal;
