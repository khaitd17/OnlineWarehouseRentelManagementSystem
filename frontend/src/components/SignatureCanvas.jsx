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
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;

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
      // Tạo canvas tạm với nền trắng để iText7 xử lý được (tránh lỗi Unknown PdfException với transparent PNG)
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      return tempCanvas.toDataURL("image/png").split(",")[1];
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
      height={220}
      style={{
        border: "2.5px dashed #0284c7",
        borderRadius: "16px",
        backgroundColor: "#f8fafc",
        cursor: "crosshair",
        display: "block",
        touchAction: "none",
        margin: "0 auto 16px auto",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.03)",
        transition: "all 0.25s ease"
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = "#0ea5e9";
        e.target.style.backgroundColor = "#fff";
        e.target.style.boxShadow = "inset 0 2px 8px rgba(14,165,233,0.04), 0 4px 12px rgba(14,165,233,0.05)";
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = "#0284c7";
        e.target.style.backgroundColor = "#f8fafc";
        e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.03)";
      }}
    />
  );
});

SignatureCanvas.displayName = "SignatureCanvas";

export default SignatureCanvas;
