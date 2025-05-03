import { useRef, useEffect } from 'react';

/**
 * A custom hook to measure the render performance of a component
 * @param componentName - The name of the component
 * @param enabled - Whether to enable performance measurement (default: false)
 */
const useComponentPerformance = (componentName: string, enabled: boolean = false) => {
  const renderCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Increment render count
    renderCountRef.current += 1;
    
    // Calculate render time
    const endTime = performance.now();
    const renderTime = startTimeRef.current > 0 ? endTime - startTimeRef.current : 0;

    // Log performance info
    console.log(
      `[Performance] ${componentName} rendered ${renderCountRef.current} times. ` +
      `Last render took ${renderTime.toFixed(2)}ms.`
    );

    // Set start time for next render
    startTimeRef.current = performance.now();
  });

  // Reset counter
  const resetCounter = () => {
    renderCountRef.current = 0;
  };

  return {
    renderCount: renderCountRef.current,
    resetCounter
  };
};

export default useComponentPerformance;