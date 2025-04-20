"use client";

import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 150,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  level = 'M',
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor
        },
        errorCorrectionLevel: level
      });
    }
  }, [value, size, bgColor, fgColor, level]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ width: size, height: size }}
    />
  );
}; 