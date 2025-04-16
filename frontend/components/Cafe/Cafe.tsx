"use client";
import React, { Suspense, useEffect, useState } from "react";
import RoomProvider from "@/app/context/room.context";
import Rooms from "../Rooms/Rooms";
import LoadingLottie from "../Loader/Loading";
import OrderProvider from "@/app/context/order.context";

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
