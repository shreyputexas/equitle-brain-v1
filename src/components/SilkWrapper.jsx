import React, { useState, useEffect } from 'react';

const SilkWrapper = ({ speed = 5, scale = 1, color = '#10B981', noiseIntensity = 1.5, rotation = 0 }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [SilkComponent, setSilkComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      setError('WebGL not supported');
      return;
    }

    setIsSupported(true);

    // Dynamically import Silk component
    import('./Silk')
      .then((module) => {
        setSilkComponent(() => module.default);
      })
      .catch((err) => {
        console.error('Failed to load Silk component:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', background: color, opacity: 0.3 }} />
    );
  }

  if (!isSupported || !SilkComponent) {
    return null;
  }

  return <SilkComponent speed={speed} scale={scale} color={color} noiseIntensity={noiseIntensity} rotation={rotation} />;
};

export default SilkWrapper;

