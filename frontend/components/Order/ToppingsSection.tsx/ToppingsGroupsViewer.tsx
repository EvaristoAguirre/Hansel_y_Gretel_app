import React, { useEffect, useState } from "react";
import {
  Chip,
  Checkbox,
  Divider,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { ITopping } from "@/components/Interfaces/IToppings";
import { IProductToppingsGroupResponse } from "@/components/Interfaces/IProducts";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import { useOrderContext } from "@/app/context/order.context";

interface ToppingsGroupsViewerProps {
  groups: IProductToppingsGroupResponse[];
  fetchGroupById: (id: string) => Promise<{ toppings: ITopping[] }>;
  productId: string;
}

const ToppingsGroupsViewer: React.FC<ToppingsGroupsViewerProps> = ({
  groups,
  fetchGroupById,
  productId,
}) => {
  const [visibleGroups, setVisibleGroups] = useState<{ [id: string]: boolean }>({});
  const [loadedToppings, setLoadedToppings] = useState<{ [id: string]: ITopping[] }>({});
  const [visibleUnits, setVisibleUnits] = useState<{ [unitIndex: number]: boolean }>({});


  const {
    selectedProducts,
    selectedToppingsByProduct,
    updateToppingForUnit
  } = useOrderContext();

  const product = selectedProducts.find((p) => p.productId === productId);
  const quantity = product?.quantity || 0;

  useEffect(() => {
    if (product && !selectedToppingsByProduct[productId]) {
      const emptyArray = Array.from({ length: product.quantity }, () => []);
      updateToppingForUnit(productId, 0, emptyArray[0]);
    }
  }, [product]);

  const handleToggleGroup = async (groupId: string) => {
    setVisibleGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));

    if (!loadedToppings[groupId]) {
      const data = await fetchGroupById(groupId);
      setLoadedToppings((prev) => ({
        ...prev,
        [groupId]: data.toppings || [],
      }));
    }
  };

  const toggleUnitVisibility = (index: number) => {
    setVisibleUnits((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        marginTop: "0.5rem",
        width: "100%",
      }}
    >
      {Array.from({ length: quantity }).map((_, unitIndex) => (
        <div key={unitIndex} style={{ flex: "1 1 calc(50% - 1rem)" }}>
          {quantity > 1 && (
            <Typography
              variant="subtitle1"
              onClick={() => toggleUnitVisibility(unitIndex)}
              sx={{
                fontWeight: 600,
                color: "#856D5E",
                backgroundColor: "#f1eae5",
                padding: "0.1rem 0.6rem",
                borderRadius: "6px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Unidad {unitIndex + 1}
            </Typography>
          )}

          {/* Mostramos grupos de toppings si: 
        - hay una sola unidad
        - o la unidad está visible en el toggle */}
          {(quantity === 1 || visibleUnits[unitIndex]) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
              {groups.map((group) => (
                <div
                  key={`${group.id}-${unitIndex}`}
                  style={{
                    flex: "1 1 calc(50% - 1rem)",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#856d5e52",
                    opacity: 0.8,
                    borderRadius: "8px",
                    padding: "0.5rem",
                    border: "1px solid #856D5E",
                    marginTop: "0.5rem",
                  }}
                >
                  <Chip
                    label={capitalizeFirstLetter(group.name)}
                    onClick={() => handleToggleGroup(group.id)}
                    style={{
                      marginBottom: "0.25rem",
                      border: "1px solid #856D5E",
                      fontWeight: 500,
                      alignSelf: "flex-start",
                      cursor: "pointer",
                      backgroundColor: "#ffffffa8",
                    }}
                  />

                  {visibleGroups[group.id] && loadedToppings[group.id] && (
                    <div
                      style={{
                        paddingLeft: "0.5rem",
                        marginTop: "0.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem",
                      }}
                    >
                      <div>
                        <Divider style={{ width: "100%" }} />
                        Máxima selección: {group.settings.maxSelection}
                      </div>

                      {loadedToppings[group.id].map((topping) => {
                        const selectedForUnit = selectedToppingsByProduct[productId]?.[unitIndex] || [];
                        const isChecked = selectedForUnit.includes(topping.id);

                        return (
                          <FormControlLabel
                            key={topping.id}
                            control={
                              <Checkbox
                                checked={isChecked}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? selectedForUnit.length < group.settings.maxSelection
                                      ? [...selectedForUnit, topping.id]
                                      : selectedForUnit
                                    : selectedForUnit.filter((id) => id !== topping.id);

                                  updateToppingForUnit(productId, unitIndex, updated);
                                }}
                              />
                            }
                            label={capitalizeFirstLetter(topping.name)}
                            sx={{ height: "25%" }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

    </div>
  );
};

export default ToppingsGroupsViewer;
