import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

const SignatureCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const startDrawing = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      isDrawing.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e) => {
      if (!isDrawing.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      isDrawing.current = false;
      ctx.closePath();
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    // Touch support
    const startDrawingTouch = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      isDrawing.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const drawTouch = (e) => {
      if (!isDrawing.current) return;

      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawingTouch = () => {
      isDrawing.current = false;
      ctx.closePath();
    };

    canvas.addEventListener("touchstart", startDrawingTouch);
    canvas.addEventListener("touchmove", drawTouch);
    canvas.addEventListener("touchend", stopDrawingTouch);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawingTouch);
      canvas.removeEventListener("touchmove", drawTouch);
      canvas.removeEventListener("touchend", stopDrawingTouch);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    toBase64: () => {
      const canvas = canvasRef.current;
      return canvas.toDataURL("image/png").split(",")[1];
    },
    isEmpty: () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return !imageData.data.some((pixel) => pixel !== 0);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={200}
      style={{
        border: "2px solid #cbd5e1",
        borderRadius: "8px",
        backgroundColor: "#fff",
        cursor: "crosshair",
        display: "block",
        touchAction: "none",
      }}
    />
  );
});

SignatureCanvas.displayName = "SignatureCanvas";

export default SignatureCanvas;
