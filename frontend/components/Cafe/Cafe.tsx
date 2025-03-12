"use client";
import React, { useEffect, useState } from "react";
import { useProductos } from "../Hooks/useProducts";
import OrderProvider from '../../app/context/order.context';
import RoomProvider from "@/app/context/room.context";
import { useAuth } from "@/app/context/authContext";
import Rooms from "../Rooms/Rooms";

const Cafe = () => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const { fetchAndSetProducts } = useProductos();
  const [navbarHeight, setNavbarHeight] = useState(0);


  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setToken(token);

    fetchAndSetProducts(token);

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
            <Rooms />
          </OrderProvider>
        </RoomProvider>
      </div>
    </div>
  );
};

export default Cafe;
