"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useProductos } from "../Hooks/useProducts";
import OrderProvider, {
  useOrderContext,
} from "../../app/context/order.context";
import RoomProvider from "@/app/context/room.context";
import { useAuth } from "@/app/context/authContext";
import Rooms from "../Rooms/Rooms";
import LoadingLottie from "../Loader/Loading";

const Cafe = () => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const { fetchAndSetProducts } = useProductos();
  const [navbarHeight, setNavbarHeight] = useState(0);
  const { selectedOrderByTable } = useOrderContext();

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
    <div
      className="cafe"
      style={{
        display: "flex",
        backgroundColor: "#D9CCBC",
        paddingTop: `${navbarHeight}px`,
      }}
    >
      <div style={{ width: "100%" }}>
        <Suspense fallback={<LoadingLottie />}>
          <RoomProvider>
            <OrderProvider>
              <Rooms />
            </OrderProvider>
          </RoomProvider>
        </Suspense>
      </div>
    </div>
  );
};

export default Cafe;
