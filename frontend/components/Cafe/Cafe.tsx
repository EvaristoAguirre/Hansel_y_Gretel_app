"use client";
import React, { Suspense, useEffect, useState } from "react";
import RoomProvider from "@/app/context/room.context";
import Rooms from "../Rooms/Rooms";
import LoadingLottie from "../Loader/Loading";
import OrderProvider from "@/app/context/order.context";
import { DailyCashProvider } from "@/app/context/dailyCashContext";

const Cafe = () => {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
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
            {/* DailyCashProvider centraliza la verificación de caja abierta:
                TableEditor la consume desde el contexto en lugar de hacer
                un fetch propio en cada apertura de mesa. */}
            <DailyCashProvider>
              <OrderProvider>
                <Rooms />
              </OrderProvider>
            </DailyCashProvider>
          </RoomProvider>
        </Suspense>
      </div>
    </div>
  );
};

export default Cafe;
