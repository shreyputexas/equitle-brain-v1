import React, { useState, useEffect } from 'react';

const PrismWrapper = ({ 
  animationType = 'rotate',
  timeScale = 0.5,
  height = 3.5,
  baseWidth = 5.5,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  noise = 0.5,
  glow = 1
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [PrismComponent, setPrismComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      setError('WebGL not supported');
      return;
    }

    setIsSupported(true);

    // Dynamically import Prism component
    import('./Prism')
      .then((module) => {
        setPrismComponent(() => module.default);
      })
      .catch((err) => {
        console.error('Failed to load Prism component:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return null; // Fail silently, don't show error
  }

  if (!isSupported || !PrismComponent) {
    return null;
  }

  return (
    <PrismComponent
      animationType={animationType}
      timeScale={timeScale}
      height={height}
      baseWidth={baseWidth}
      scale={scale}
      hueShift={hueShift}
      colorFrequency={colorFrequency}
      noise={noise}
      glow={glow}
    />
  );
};

export default PrismWrapper;

