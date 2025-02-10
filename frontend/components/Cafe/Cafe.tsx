"use client";
import React, { useEffect } from "react";
import { MesaInterface, MozoInterface } from "../Interfaces/Cafe_interfaces";
import { useProductos } from "../Hooks/useProducts";
import Salas from "../Salas/salas";

const Cafe = () => {
  const { fetchAndSetProducts } = useProductos();

  useEffect(() => {
    fetchAndSetProducts();
  }, []);

  return (
    <div className="cafe" style={{ display: "flex", height: "100vh", backgroundColor: "#D9CCBC", marginTop: "100px" }}>
      <div style={{ width: "100%" }}>
        <Salas></Salas>
      </div>

    </div>
  );
};

export default Cafe;
