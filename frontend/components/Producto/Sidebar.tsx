import React from "react";
import { Drawer, List, ListItem, ListItemText, Typography, ListItemButton } from "@mui/material";

interface SidebarProps {
  categories: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ categories }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: 240,
      flexShrink: 0,
      "& .MuiDrawer-paper": {
        width: 240,
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        height: "100vh",
      },
    }}
  >
    <Typography variant="h6" sx={{ p: 2 }}>
      Productos
    </Typography>
    <List>
      {categories.map((text) => (
        <ListItem key={text}>
          <ListItemButton>
            <ListItemText primary={text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Drawer>
);
