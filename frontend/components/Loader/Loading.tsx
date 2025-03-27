'use client';
import Lottie from "lottie-react";
import loadingAnimation from "../../public/loadingAnimation.json";

const LoadingLottie = () => {
  return (
    <div className="flex items-center justify-center flex-1">
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: '30%', height: '30%' }}
      />
    </div>
  );
};

export default LoadingLottie;