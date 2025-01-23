import React, { useState } from "react";
import { Drawer, List, ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useCategoryStore } from "../Categorías/useCategoryStore";

interface SidebarProps {
  categories: string[];
}

export const Sidebar: React.FC<SidebarProps> = () => {
  // Estado para la categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    categories,
    setCategories,
    addCategory,
    removeCategory,
    updateCategory,
    connectWebSocket,
  } = useCategoryStore();

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category); // Cambia la categoría seleccionada
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: '20%',
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: '100%',
          backgroundColor: "var(--color-primary)",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
        },
      }}
    >
      <List>
        {categories && categories.map((category) => (
          <ListItem key={category.id} disablePadding>
            <ListItemButton
              onClick={() => handleCategoryClick(category.name)} // Al hacer clic, cambia la categoría seleccionada
              sx={{
                backgroundColor: selectedCategory === category.name ? "#f3d49ab8" : "transparent", // Cambia el color de fondo si es seleccionado
                "& .MuiTypography-root": {
                  color: selectedCategory === category.name ? "black" : "white", // Cambia el color del texto si es seleccionado
                },
              }}
            >
              <ListItemText primary={category.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};
