"use client";

import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { UploadedFile } from "@/app/types/chat";
import { uploadFileToBlob } from "@/app/lib/chat/blob-upload";
import { trackEvent } from "@/app/lib/analytics/client";
import {
  errorKind,
  fileExtension,
  sizeBucket,
  type UploadSource,
} from "@/app/lib/analytics/events";

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
  const [uploadBatchCount, setUploadBatchCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const isUploading = uploadBatchCount > 0;

  const processFile = useCallback(
    async (file: File, source: UploadSource) => {
      const properties = {
        content_type: file.type || "application/octet-stream",
        extension: fileExtension(file.name),
        size_bucket: sizeBucket(file.size),
        source,
      };
      if (!isAcceptedFile(file)) {
        trackEvent("file_upload_rejected", properties);
        return;
      }
      try {
        const uploaded = await uploadFileToBlob(file);
        onUploaded(uploaded);
        trackEvent("file_upload_succeeded", properties);
      } catch (err) {
        trackEvent("file_upload_failed", {
          ...properties,
          error_kind: errorKind(err),
        });
        console.error("File upload failed:", err);
      }
    },
    [onUploaded],
  );

  const processFiles = useCallback(
    async (files: File[], source: UploadSource) => {
      if (files.length === 0) return;
      setUploadBatchCount((count) => count + 1);
      try {
        for (const file of files) {
          await processFile(file, source);
        }
      } finally {
        setUploadBatchCount((count) => Math.max(0, count - 1));
      }
    },
    [processFile],
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      void processFiles(files, "file_picker");
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      void processFiles(Array.from(e.dataTransfer.files), "drag_drop");
    },
    [processFiles],
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
