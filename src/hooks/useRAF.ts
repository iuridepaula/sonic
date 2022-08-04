import React, { useEffect, useRef } from "react";

export function useRAF<Args extends any[]>(
  frameHandler: (args: Args) => void,
  args: Args,
  deps?: React.DependencyList
) {
  const frame = useRef(0);
  const animate = (time: number) => {
    frame.current = requestAnimationFrame(animate);

    // FPS THROTLE
    // ?

    frameHandler(args);
  };

  useEffect(() => {
    frame.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame.current);
    };
  }, deps || []);
}
