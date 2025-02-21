"use client";
import React, { useEffect, useState } from "react";
import { useProductos } from "../Hooks/useProducts";
import Salas from "../Rooms/Rooms";
import OrderProvider from '../../app/context/order.context';
import RoomProvider from "@/app/context/room.context";

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
        <RoomProvider>
          <OrderProvider>
            <Salas />
          </OrderProvider>
        </RoomProvider>
      </div>
    </div>
  );
};

export default Cafe;
