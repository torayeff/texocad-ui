"use client";

import { useState, useRef, useCallback } from "react";
import type { UploadedFile } from "@/app/types/chat";
import { uploadFileToBlob } from "@/app/lib/chat/blob-upload";

const ACCEPTED_TYPES =
  ".txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.svg";

const ACCEPTED_MIME_PREFIX = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "image/",
];

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_MIME_PREFIX.some((prefix) =>
    file.type.startsWith(prefix),
  );
}

export function useFileUpload(onUploaded: (file: UploadedFile) => void) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const processFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFile(file)) return;
      setIsUploading(true);
      try {
        const uploaded = await uploadFileToBlob(file);
        onUploaded(uploaded);
      } catch (err) {
        console.error("File upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploaded],
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return {
    fileInputRef,
    isUploading,
    isDragging,
    triggerFileSelect,
    handleFileChange,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    acceptedTypes: ACCEPTED_TYPES,
  } as const;
}
