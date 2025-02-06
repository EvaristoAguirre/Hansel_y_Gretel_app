"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Autocomplete,
} from "@mui/material";
import Swal from "sweetalert2";
import { useProductStore } from "../Hooks/useProductStore";
import { URI_PRODUCT } from "../URI/URI";
import Mesa from "../Mesa/Mesa";
import Sala from "../Salas/Sala";
import { MesaInterface, MozoInterface } from "../Interfaces/Cafe_interfaces";
import { useProductos } from "../Hooks/useProducts";
import Salas from "../Salas/salas";

const Cafe = () => {
  const { fetchAndSetProducts } = useProductos();

  useEffect(() => {
    fetchAndSetProducts();
  }, []);

  return (
    <div className="cafe" style={{ display: "flex", height: "100vh", backgroundColor: "white", marginTop: "100px" }}>
      {/* Lista de mesas */}
      <div className="salas-y-mesas" style={{ width: "100%" }}>
        {/* <Sala></Sala> */}
        <Salas></Salas>
      </div>
      {/* <Mesa_menu></Mesa_menu> */}
    </div>
  );
};

export default Cafe;
