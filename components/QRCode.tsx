"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

export default function QRCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width: 256,
      margin: 2,
      color: { dark: "#1c1917", light: "#ffffff" },
    });
  }, [url]);

  return <canvas ref={canvasRef} className="mx-auto rounded-xl" />;
}
