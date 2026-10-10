import React, { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

export const CircleScrollTurn = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Dynamic circular turn effect based on scroll depth
      const scrollY = window.scrollY;
      setRotation(scrollY * 0.4);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollDown = () => {
    window.scrollBy({ top: 600, behavior: "smooth" });
  };

  return (
    <div
      className="circle-turn-widget"
      onClick={handleScrollDown}
      title="Scroll down through FinOps sections"
    >
      {/* SVG Circular Text Ring that turns as you scroll */}
      <svg
        className="circle-turn-svg"
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <path
          id="circlePath"
          d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          fill="none"
        />
        <text
          fill="#0f172a"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2.5"
        >
          <textPath href="#circlePath" startOffset="0%">
            • SCROLL DOWN • FINOPS AI • EXPLORE FLEET
          </textPath>
        </text>
      </svg>

      {/* Center Directional Arrow */}
      <div className="circle-turn-center-icon">
        <ArrowDown size={22} />
      </div>
    </div>
  );
};
