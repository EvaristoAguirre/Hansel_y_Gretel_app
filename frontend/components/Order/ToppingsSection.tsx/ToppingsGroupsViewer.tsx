import React, { useEffect, useState } from "react";
import {
  Chip,
  Checkbox,
  Divider,
  FormControlLabel,
} from "@mui/material";
import { ITopping } from "@/components/Interfaces/IToppings";
import {
  IProductToppingsGroupResponse,
} from "@/components/Interfaces/IProducts";
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
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const {
    handleAddTopping,
    selectedProducts
  } = useOrderContext();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const product = selectedProducts.find(p => p.productId === productId);
    if (product?.toppingsIds) {
      setSelectedToppings(product.toppingsIds);
    }
    setInitialized(true);
  }, [initialized, selectedProducts, productId]);


  // Enviar al contexto los toppings seleccionados
  useEffect(() => {
    handleAddTopping(productId, Object.values(selectedToppings).flat());

  }, [selectedToppings]);

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
      {groups.map((group) => (
        <div
          key={group.id}
          style={{
            flex: "1 1 calc(50% - 1rem)",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#856d5e52",
            opacity: 0.8,
            borderRadius: "8px",
            padding: "0.5rem",
            border: "1px solid #856D5E",
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

              {loadedToppings[group.id].map((topping) => (
                <FormControlLabel
                  key={topping.id}
                  control={
                    <Checkbox
                      checked={selectedToppings.includes(topping.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;

                        setSelectedToppings((prev) => {
                          if (isChecked) {
                            if (prev.length >= group.settings.maxSelection) return prev;
                            return [...prev, topping.id];
                          } else {
                            return prev.filter((id) => id !== topping.id);
                          }
                        });
                      }}
                    />
                  }
                  label={capitalizeFirstLetter(topping.name)}
                  sx={{ height: "25%" }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToppingsGroupsViewer;
