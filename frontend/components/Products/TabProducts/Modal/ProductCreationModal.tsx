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
  Tooltip,
} from "@mui/material";
import Grid from '@mui/material/Grid';
import {
  ProductForm,
  ProductForPromo,
  ProductResponse,
  ProductToppingsGroupDto,
} from "@/components/Interfaces/IProducts";
import { ICategory } from "@/components/Interfaces/ICategories";
import { FormTypeProduct, TabProductKey, TypeProduct } from "@/components/Enums/view-products";
import { getProductByCode, getProductByName } from "@/api/products";
import { useAuth } from "@/app/context/authContext";
import { IingredientForm } from "@/components/Interfaces/Ingredients";
import IngredientDialog from "./IngredientDialog";
import InputsPromo from "./InputsPromo";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { NumericFormat } from "react-number-format";
import { CheckAllowsToppings } from "./Toppings/CheckAllowsToppings";
import { AvailableToppingsGroups } from "./Toppings/AvailableToppingsGroups";
import NumericInput from "@/components/Utils/NumericInput";

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
      | ICategory[]
      | IingredientForm[]
      | ProductForPromo[]
      | boolean
      | ProductToppingsGroupDto[]
  ) => void;
  onSave: () => void;
  modalType: FormTypeProduct;
  products: ProductResponse[];
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

  const [tabValue, setTabValue] = useState<TabProductKey>(TabProductKey.SIMPLE_PRODUCT);
  const [disableTabs, setDisableTabs] = useState<TabProductKey[]>([]);

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
    baseCost: "",
    cost: "",
    categories: "",
    products: "",
    ingredients: "",
    isActive: "",
    id: "",
    availableToppingGroups: "",
    toppingsSettings: "",
    unitOfMeasure: "",
    unitOfMeasureId: "",
    unitOfMeasureConversions: "",

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


  useEffect(() => {
    validateForm(errors);
  }, [errors, form]);

  useEffect(() => {
    if (!form.allowsToppings) {
      onChange("availableToppingGroups", []);
    }
  }, [form.allowsToppings]);



  const fieldLabels: Record<keyof ProductForm, string> = {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    price: "Precio",
    baseCost: "Costo Base",
    cost: "Costo Total",
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
    if (["code", "name", "price", "baseCost"].includes(field)) {
      if (!value) {
        error = "Este campo es obligatorio";
      } else if (field === "code") {
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
      } else if ((field === "price" || field === "baseCost") && value <= 0) {
        error = "Debe ser un número positivo";
      } else if (field === "name") {
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
    if (field === "products" && Array.isArray(value) && value.length === 0) {
      error = "Debe seleccionar al menos un producto";
      setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    }
  };
  const isToppingsSectionValid = (): boolean => {
    if (!form.allowsToppings) return true;
    if (!Array.isArray(form.availableToppingGroups) || form.availableToppingGroups.length === 0) {
      return false;
    }
    return form.availableToppingGroups.every(group =>
      !!group.toppingsGroupId &&
      typeof group.quantityOfTopping === "number" && group.quantityOfTopping > 0 &&
      group.settings &&
      typeof group.settings.maxSelection === "number" && group.settings.maxSelection >= 1 &&
      group.unitOfMeasureId
    );
  };

  const validateForm = (currentErrors = errors) => {
    const hasErrors = Object.values(currentErrors).some((error) => error);
    const validationFields: { [key in TabProductKey]: string[] } = {
      [TabProductKey.SIMPLE_PRODUCT]: ["code", "name", "price", "baseCost", "categories", "availableToppingGroups"],
      [TabProductKey.PRODUCT_WITH_INGREDIENT]: ["code", "name", "price", "ingredients"],
      [TabProductKey.PROMO]: ["code", "name", "price", "products"],
    };

    const hasEmptyFields =
      validationFields[tabValue].some((field) => {
        if (field === "products") {
          return !Array.isArray(form.products) || form.products.length === 0;
        } else if (field === "ingredients") {
          return !Array.isArray(form.ingredients) || form.ingredients.length === 0;
        }
        return !form[field as keyof ProductForm];
      }) ||
      !Array.isArray(form.categories) ||
      form.categories.length === 0;

    const isValidToppings = isToppingsSectionValid();
    setIsFormValid(!hasErrors && !hasEmptyFields && isValidToppings);

  };

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
    setDisableTabs(newDisableTabs);
  }

  const onDisableTabs = (tabKey: TabProductKey) => {
    if (modalType === FormTypeProduct.EDIT) {
      switch (tabKey) {
        case TabProductKey.SIMPLE_PRODUCT:
          return form.type === TypeProduct.PROMO || form.ingredients.length > 0;

        case TabProductKey.PRODUCT_WITH_INGREDIENT:
          return (
            form.type === TypeProduct.SIMPLE ||
            form.type === TypeProduct.PROMO ||
            (form.type === TypeProduct.PRODUCT && (!Array.isArray(form.ingredients) || form.ingredients.length === 0))
          );

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
      return (form.type === TypeProduct.PRODUCT) || (form.type === TypeProduct.SIMPLE) ? "Guardar producto" : "Guardar promo";
    }
    return "Guardar producto";
  };

  const fieldsToRender = ["name", "code", "price"];

  if (tabValue === TabProductKey.SIMPLE_PRODUCT) {
    fieldsToRender.push("baseCost", "cost");
  }



  return (
    <Modal open={open} onClose={onClose} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Box
        sx={{
          width: 600,
          bgcolor: "background.paper",
          p: 4,
          mx: "auto",
          mt: 2,
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
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
              {(field === "price" || field === "baseCost") ? (
                <Tooltip
                  title={
                    field === "baseCost"
                      ? "Costo base del producto, sin incluir agregados"
                      : ""
                  }
                  arrow
                  placement="top"
                  enterDelay={150}
                >
                  <Box>
                    <NumericInput
                      label={fieldLabels[field]}
                      value={form[field]}
                      onChange={(num) => {
                        onChange(field as keyof ProductForm, num);
                        validateField(field, num);
                      }}
                      error={!!errors[field]}
                      helperText={errors[field]}
                    />
                  </Box>
                </Tooltip>
              ) : (
                <Tooltip
                  title={
                    field === "cost"
                      ? "Costo total calculado automáticamente, incluye el Costo Base + Costo Agregados. No se puede editar"
                      : ""
                  }
                  arrow
                  placement="top"
                  disableHoverListener={field !== "cost"}
                  enterDelay={150}
                >
                  <Box>
                    <TextField
                      fullWidth
                      label={fieldLabels[field]}
                      type={["price", "baseCost", "cost"].includes(field) ? "number" : "text"}
                      inputProps={{
                        onKeyDown: (e) => {
                          if (
                            ["price", "baseCost", "code", "cost"].includes(field) &&
                            ["e", "E", "+", "-"].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        },
                        readOnly: field === "cost",
                        style: field === "cost" ? { cursor: "default" } : {},
                      }}
                      value={form[field] ?? ""}
                      onChange={(e) => {
                        const value = ["price", "baseCost"].includes(field)
                          ? e.target.value === ""
                            ? null
                            : parseFloat(e.target.value)
                          : field === "code"
                            ? e.target.value === ""
                              ? null
                              : parseInt(e.target.value, 10)
                            : e.target.value;
                        onChange(field as keyof ProductForm, value);
                        if (!["code", "name"].includes(field)) {
                          validateField(field, value);
                        }
                      }}
                      onBlur={(e) => {
                        if (["code", "name"].includes(field)) {
                          validateField(field, e.target.value);
                        }
                      }}
                      error={!!errors[field]}
                      helperText={
                        isCheckingCode && field === "code"
                          ? "Verificando código..."
                          : errors[field]
                      }
                      variant="outlined"
                      size="small"

                    />
                  </Box>
                </Tooltip>
              )}
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
          {/* ------------------------- */}
          {/* CATEGORIAS - AUTOCOMPLETE */}
          <Grid item xs={12} mt={1}>
            <FormControl fullWidth>
              <Autocomplete
                multiple
                options={categories}
                getOptionLabel={(option) => option.name}
                value={
                  form.categories
                }
                onChange={(_, newValue) => {
                  onChange("categories", newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categorías"
                    variant="outlined"
                    placeholder="Selecciona categorías"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={typeof option === 'string' ? option : option.id}
                      label={option.name}
                      sx={{
                        backgroundColor: "#f3d49ab8",
                        color: "black",
                        fontWeight: "bold",
                      }}
                    />
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

        {/* SECCIÓN DE PERMITIR AGREGADOS */}
        {
          (tabValue === TabProductKey.SIMPLE_PRODUCT || tabValue === TabProductKey.PRODUCT_WITH_INGREDIENT) && (
            <>
              <CheckAllowsToppings
                allowsToppings={form.allowsToppings}
                setAllowsToppings={(value) => {
                  onChange("allowsToppings", value as boolean);
                }}
              />

              {form.allowsToppings && (
                <AvailableToppingsGroups
                  value={form.availableToppingGroups ?? []}
                  onChange={(updatedGroups) => {
                    onChange("availableToppingGroups", updatedGroups);
                    validateForm();
                  }}
                  units={units}
                />

              )}
              {form.allowsToppings && !isToppingsSectionValid() && (
                <Box mt={1} color="error.main" fontSize="0.9rem">
                  Completar correctamente los campos.
                </Box>
              )}

            </>
          )
        }

        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button sx={{ mt: 2 }} onClick={() => {
            onClose();
          }} color="warning">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveProduct} sx={{ mt: 2 }} disabled={!isFormValid}>
            {getButtonText()}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default ProductCreationModal;
