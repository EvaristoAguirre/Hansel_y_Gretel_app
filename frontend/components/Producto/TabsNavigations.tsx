import React from "react";
import { AppBar, Tabs, Tab } from "@mui/material";

interface TabsNavigationProps {
  tabIndex: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  tabIndex,
  onTabChange,
}) => (
  <AppBar position="static" color="default">
    <Tabs value={tabIndex} onChange={onTabChange} textColor="inherit">
      <Tab label="Productos" />
      <Tab label="Ingredientes" />
      <Tab label="Categoría productos" />
      <Tab label="Categoría ingredientes" />
      <Tab label="Control de Stock" />
    </Tabs>
  </AppBar>
);
