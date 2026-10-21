"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import type { SketchMaskEditorHandle } from "@/app/components/sketch-viewer/_types/sketch-mask-editor";
import type { SketchSource } from "@/app/types/sketch-viewer";

const DEFAULT_BRUSH_SIZE = 36;
const MASK_FILENAME = "sketch-mask.png";

interface MaskPoint {
  x: number;
  y: number;
}

interface SketchMaskEditorProps {
  isSubmitting: boolean;
  source: SketchSource;
  onMaskChange: (hasMask: boolean) => void;
}

function drawStroke(
  canvas: HTMLCanvasElement,
  from: MaskPoint,
  to: MaskPoint,
  brushSize: number,
  mode: "preview" | "mask",
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = brushSize;

  if (mode === "mask") {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0,0,0,1)";
    context.fillStyle = "rgba(0,0,0,1)";
  } else {
    context.strokeStyle = "rgba(14,165,233,0.52)";
    context.fillStyle = "rgba(14,165,233,0.52)";
  }

  if (from.x === to.x && from.y === to.y) {
    context.beginPath();
    context.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  context.restore();
}

function initializeMaskCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,1)";
  context.fillRect(0, 0, width, height);
}

function clearPreviewCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.clearRect(0, 0, width, height);
}

function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export mask image."));
        return;
      }
      resolve(new File([blob], MASK_FILENAME, { type: "image/png" }));
    }, "image/png");
  });
}

export const SketchMaskEditor = forwardRef<SketchMaskEditorHandle, SketchMaskEditorProps>(function SketchMaskEditor({
  isSubmitting,
  onMaskChange,
  source,
}: SketchMaskEditorProps, ref) {
  const [hasMask, setHasMask] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<MaskPoint | null>(null);
  const brushSizeRef = useRef(DEFAULT_BRUSH_SIZE);

  const resetCanvases = useCallback(() => {
    const image = imageRef.current;
    const previewCanvas = previewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!image || !previewCanvas || !maskCanvas || image.naturalWidth === 0 || image.naturalHeight === 0) return;

    clearPreviewCanvas(previewCanvas, image.naturalWidth, image.naturalHeight);
    initializeMaskCanvas(maskCanvas, image.naturalWidth, image.naturalHeight);
    setHasMask(false);
  }, []);

  useEffect(() => {
    resetCanvases();
  }, [resetCanvases, source.url]);

  useEffect(() => {
    onMaskChange(hasMask);
  }, [hasMask, onMaskChange]);

  const pointFromEvent = useCallback((event: React.PointerEvent<HTMLCanvasElement>): MaskPoint | null => {
    const image = imageRef.current;
    if (!image || image.naturalWidth === 0 || image.naturalHeight === 0) return null;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * image.naturalWidth,
      y: ((event.clientY - rect.top) / rect.height) * image.naturalHeight,
    };
  }, []);

  const brushSizeForEvent = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const image = imageRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!image || rect.width === 0) return DEFAULT_BRUSH_SIZE;
    return (DEFAULT_BRUSH_SIZE / rect.width) * image.naturalWidth;
  }, []);

  const drawAtPoint = useCallback((point: MaskPoint) => {
    const previewCanvas = previewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const previousPoint = lastPointRef.current ?? point;
    const brushSize = brushSizeRef.current;
    if (!previewCanvas || !maskCanvas) return;

    drawStroke(previewCanvas, previousPoint, point, brushSize, "preview");
    drawStroke(maskCanvas, previousPoint, point, brushSize, "mask");
    lastPointRef.current = point;
    setHasMask(true);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    if (!point || isSubmitting) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    brushSizeRef.current = brushSizeForEvent(event);
    lastPointRef.current = point;
    drawAtPoint(point);
  }, [brushSizeForEvent, drawAtPoint, isSubmitting, pointFromEvent]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || isSubmitting) return;

    const point = pointFromEvent(event);
    if (!point) return;
    drawAtPoint(point);
  }, [drawAtPoint, isSubmitting, pointFromEvent]);

  const stopDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (isSubmitting) return;
    resetCanvases();
  }, [isSubmitting, resetCanvases]);

  useImperativeHandle(ref, () => ({
    clear: handleClear,
    createMaskFile: async () => {
      const maskCanvas = maskCanvasRef.current;
      if (!hasMask || !maskCanvas) {
        throw new Error("Brush the area you want to edit first.");
      }

      return canvasToFile(maskCanvas);
    },
  }), [handleClear, hasMask]);

  return (
    <div className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed blob URLs are short-lived and not configured for Next image optimization */}
      <img
        ref={imageRef}
        src={source.url}
        alt={source.label}
        onLoad={resetCanvases}
        className="h-auto w-auto max-w-[min(1024px,calc(100vw-2rem))] max-h-[calc(var(--app-viewport-height)-12rem)] select-none object-contain"
        draggable={false}
      />
      <canvas
        ref={previewCanvasRef}
        aria-label="Brush mask edit area"
        className="absolute inset-0 size-full touch-none cursor-crosshair rounded-sm"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onPointerLeave={(event) => {
          if (drawingRef.current) stopDrawing(event);
        }}
      />
      <canvas ref={maskCanvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
});
