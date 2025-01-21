import React from "react";
import { AppBar, Tabs, Tab } from "@mui/material";

interface TabsNavigationProps {
  tabIndex: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: string[];
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  tabIndex,
  onTabChange,
  tabs,
}) => (
  <AppBar
    position="static"
    sx={{ backgroundColor: "#7d716a4e", color: "black", gap: 4 }}
  >
    <Tabs
      value={tabIndex}
      onChange={onTabChange}
      textColor="inherit"
      sx={{
        "& .MuiTab-root": {
          fontWeight: "bold !important" as any,
          width: "auto", 
          flex: 1,
        },
        "& .MuiTab-root.Mui-selected": {
          color: "white !important",
          backgroundColor: "var(--color-primary)!important",
        },
        "& .MuiTabs-indicator": {
          backgroundColor: "#f3d49a !important",
        },
      }}
    >
      {tabs.map((label, index) => (
        <Tab key={index} label={label} />
      ))}
    </Tabs>
  </AppBar>
);
