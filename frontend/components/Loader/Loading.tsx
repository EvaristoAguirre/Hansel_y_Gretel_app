'use client';
import Lottie from "lottie-react";
import loadingAnimation from "../../public/loadingAnimation.json";

const LoadingLottie = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: 150, height: 150 }}
      />
    </div>
  );
};

export default LoadingLottie;
