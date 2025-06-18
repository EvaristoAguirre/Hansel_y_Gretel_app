import React, { useState } from "react";
import {
  Chip,
  Checkbox,
  Divider,
  FormControlLabel,
  useMediaQuery,
} from "@mui/material";
import { ITopping } from "@/components/Interfaces/IToppings";
import { IProductToppingsGroupResponse } from "@/components/Interfaces/IProducts";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";

interface ToppingsGroupsViewerProps {
  groups: IProductToppingsGroupResponse[];
  fetchGroupById: (id: string) => Promise<{ toppings: ITopping[] }>;
}

const ToppingsGroupsViewer: React.FC<ToppingsGroupsViewerProps> = ({
  groups,
  fetchGroupById,
}) => {
  const [visibleGroups, setVisibleGroups] = useState<{ [id: string]: boolean }>(
    {}
  );
  const [loadedToppings, setLoadedToppings] = useState<{
    [id: string]: ITopping[];
  }>({});

  const isSmallScreen = useMediaQuery("(max-width:600px)");

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
                gap: "0.25rem",
              }}
            >
              {loadedToppings[group.id].map((topping) => (
                <FormControlLabel
                  key={topping.id}
                  control={<Checkbox checked disabled />}
                  label={topping.name}
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
