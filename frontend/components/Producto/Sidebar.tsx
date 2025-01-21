import React, { useState } from "react";
import { Drawer, List, ListItem, ListItemText, ListItemButton } from "@mui/material";

interface SidebarProps {
  categories: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ categories }) => {
  // Estado para la categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category); // Cambia la categoría seleccionada
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 253,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 253,
          backgroundColor: "var(--color-primary)",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
        },
      }}
    >
      <List>
        {categories.map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton
              onClick={() => handleCategoryClick(text)} // Al hacer clic, cambia la categoría seleccionada
              sx={{
                backgroundColor: selectedCategory === text ? "#f3d49ab8" : "transparent", // Cambia el color de fondo si es seleccionado
                "& .MuiTypography-root": {
                  color: selectedCategory === text ? "black" : "white", // Cambia el color del texto si es seleccionado
                },
              }}
            >
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};
