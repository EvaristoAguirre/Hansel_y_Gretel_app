"use client";
import React, { useEffect, useState } from "react";
import { useProductos } from "../Hooks/useProducts";
import Salas from "../Salas/salas";

const Cafe = () => {
  const { fetchAndSetProducts } = useProductos();
  const [navbarHeight, setNavbarHeight] = useState(0);


  useEffect(() => {
    fetchAndSetProducts();

    const navbar = document.querySelector("nav");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    }
  }, []);

  return (
    <div className="cafe" style={{
      display: "flex",
      backgroundColor: "#D9CCBC", paddingTop: `${navbarHeight}px`
    }}>
      <div style={{ width: "100%" }}>
        <Salas></Salas>
      </div>
    </div>
  );
};

export default Cafe;
