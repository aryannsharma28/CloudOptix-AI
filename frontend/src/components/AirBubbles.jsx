import React, { useMemo } from "react";

export const AirBubbles = () => {
  // Generate a collection of realistic air bubbles with diverse speeds and sizes
  const bubbles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 32) + 12, // 12px to 44px
      left: Math.floor(Math.random() * 96) + 2, // 2% to 98% width
      duration: (Math.random() * 9 + 8).toFixed(1), // 8s to 17s
      delay: (Math.random() * 10).toFixed(1), // 0s to 10s
      opacity: (Math.random() * 0.4 + 0.25).toFixed(2)
    }));
  }, []);

  return (
    <div className="air-bubbles-container" aria-hidden="true">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="air-bubble"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity
          }}
        />
      ))}
    </div>
  );
};
