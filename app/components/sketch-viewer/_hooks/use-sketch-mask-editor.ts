"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SketchMaskEditorHandle } from "@/app/components/sketch-viewer/_types/sketch-mask-editor";
import type {
  SketchMaskComposerState,
  SketchMaskEditRequest,
} from "@/app/types/sketch-viewer";

interface UseSketchMaskEditorOptions {
  isMaskSubmitting: boolean;
  onMaskEditorChange?: (state: SketchMaskComposerState | null) => void;
  onSubmitMaskEdit?: (request: SketchMaskEditRequest) => Promise<void> | void;
  canMask: boolean;
}

export function useSketchMaskEditor({
  isMaskSubmitting,
  onMaskEditorChange,
  onSubmitMaskEdit,
  canMask,
}: UseSketchMaskEditorOptions) {
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [maskError, setMaskError] = useState<string | null>(null);
  const maskEditorRef = useRef<SketchMaskEditorHandle | null>(null);

  const handleCloseMaskEditor = useCallback(() => {
    if (isMaskSubmitting) return;
    setIsMaskEditorOpen(false);
    setHasMask(false);
    setMaskError(null);
  }, [isMaskSubmitting]);

  const handleSubmitMaskEdit = useCallback(async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      const message = "Describe what should change inside the masked area.";
      setMaskError(message);
      throw new Error(message);
    }

    try {
      const mask = await maskEditorRef.current?.createMaskFile();
      if (!mask) {
        throw new Error("Brush the area you want to edit first.");
      }

      if (!onSubmitMaskEdit) {
        throw new Error("Mask editing is not available.");
      }

      await onSubmitMaskEdit({ prompt: trimmedPrompt, mask });
      setIsMaskEditorOpen(false);
      setHasMask(false);
      setMaskError(null);
      onMaskEditorChange?.(null);
    } catch (submitError) {
      setMaskError(submitError instanceof Error ? submitError.message : "Could not submit masked edit.");
      throw submitError;
    }
  }, [onMaskEditorChange, onSubmitMaskEdit]);

  const handleMaskChange = useCallback((nextHasMask: boolean) => {
    setHasMask(nextHasMask);
    if (nextHasMask) {
      setMaskError(null);
    }
  }, []);

  const handleOpenMaskEditor = useCallback((closeRevisions: () => void) => {
    closeRevisions();
    setMaskError(null);
    setIsMaskEditorOpen(true);
  }, []);

  useEffect(() => {
    if (!isMaskEditorOpen || !canMask) {
      onMaskEditorChange?.(null);
      return;
    }

    onMaskEditorChange?.({
      canSubmit: hasMask,
      clear: () => maskEditorRef.current?.clear(),
      close: handleCloseMaskEditor,
      error: maskError,
      isSubmitting: isMaskSubmitting,
      submit: handleSubmitMaskEdit,
    });
  }, [
    canMask,
    handleCloseMaskEditor,
    handleSubmitMaskEdit,
    hasMask,
    isMaskEditorOpen,
    isMaskSubmitting,
    maskError,
    onMaskEditorChange,
  ]);

  return {
    hasMask,
    handleCloseMaskEditor,
    handleMaskChange,
    handleOpenMaskEditor,
    handleSubmitMaskEdit,
    isMaskEditorOpen,
    maskEditorRef,
    maskError,
  };
}
