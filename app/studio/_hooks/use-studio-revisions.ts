"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ShareRevision } from "@/app/types/share-artifact";
import {
  CAD_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  isEndToEndAssistantId,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import {
  latestDesignRevision,
  latestModelRevision as getLatestModelRevision,
  latestSketchRevision as getLatestSketchRevision,
} from "@/app/lib/design-revisions/design-artifacts";
import {
  isGlbExport,
  isStepExport,
  isSketchImageExport,
  mergeDesignRevisions,
  mergeModelRevisions,
  mergeSketchRevisions,
  modelRevisionKey,
  modelRevisionListsMatch,
  modelRevisionsMatch,
  revisionKey,
  revisionListsMatch,
  revisionOptionsFromArtifacts,
  revisionsMatch,
  signedModelRevisionSources as getSignedModelRevisionSources,
  signedSketchRevisionSources as getSignedSketchRevisionSources,
  signedRevisionSources as getSignedRevisionSources,
  sketchRevisionKey,
  sketchRevisionListsMatch,
  sketchRevisionOptionsFromArtifacts,
  sketchRevisionsMatch,
  type SignedModelRevisionSources,
  type SignedSketchRevisionSources,
  type SignedRevisionSources,
} from "@/app/lib/design-revisions/revision-sources";
import type {
  DesignRevisionArtifact,
  ModelRevisionArtifact,
  SketchRevisionArtifact,
} from "@/app/types/design-artifact";
import type { ViewerRevisionOption } from "@/app/types/model-viewer";
import type { LumiViewerMode } from "@/app/studio/_types/lumi-viewer";

function modelRevisionOptionsFromArtifacts(revisions: ModelRevisionArtifact[]): ViewerRevisionOption[] {
  return revisions
    .map((revision) => {
      const glbExport = revision.exports.find(isGlbExport);
      return {
        key: modelRevisionKey(revision),
        revisionNumber: revision.revisionNumber,
        filename: glbExport?.filename ?? null,
        canView: glbExport !== undefined,
      };
    })
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}

export function useStudioRevisions(studioMode: AssistantId, setStudioMode: (mode: AssistantId) => void) {
  const [signedRevisionSources, setSignedRevisionSources] = useState<SignedRevisionSources | null>(null);
  const [signedSketchRevisionSources, setSignedSketchRevisionSources] = useState<SignedSketchRevisionSources[]>([]);
  const [signedModelRevisionSources, setSignedModelRevisionSources] = useState<SignedModelRevisionSources | null>(null);
  const [hydratedDesignRevisions, setHydratedDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [liveDesignRevisions, setLiveDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [hydratedSketchRevisions, setHydratedSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [liveSketchRevisions, setLiveSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [hydratedModelRevisions, setHydratedModelRevisions] = useState<ModelRevisionArtifact[]>([]);
  const [liveModelRevisions, setLiveModelRevisions] = useState<ModelRevisionArtifact[]>([]);
  const [selectedRevisionKey, setSelectedRevisionKey] = useState<string | null>(null);
  const [selectedSketchRevisionKey, setSelectedSketchRevisionKey] = useState<string | null>(null);
  const [selectedModelRevisionKey, setSelectedModelRevisionKey] = useState<string | null>(null);
  const [lumiModeOverride, setLumiModeOverride] = useState<{ mode: LumiViewerMode; atKey: string } | null>(null);
  const designRequestVersionRef = useRef(0);
  const sketchRequestVersionRef = useRef(0);
  const modelRequestVersionRef = useRef(0);
  const isEndToEndMode = isEndToEndAssistantId(studioMode);

  const handleDesignRevision = useCallback((revision: DesignRevisionArtifact) => {
    setLiveDesignRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => revisionKey(currentRevision) === revisionKey(revision));
      if (existingRevision && revisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => revisionKey(currentRevision) !== revisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
    setStudioMode(CAD_ASSISTANT_ID);
  }, [setStudioMode]);

  const handleSketchRevision = useCallback((revision: SketchRevisionArtifact) => {
    setLiveSketchRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => sketchRevisionKey(currentRevision) === sketchRevisionKey(revision));
      if (existingRevision && sketchRevisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => sketchRevisionKey(currentRevision) !== sketchRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
    if (!isEndToEndMode) setStudioMode(SKETCH_ASSISTANT_ID);
  }, [isEndToEndMode, setStudioMode]);

  const handleModelRevision = useCallback((revision: ModelRevisionArtifact) => {
    setLiveModelRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => modelRevisionKey(currentRevision) === modelRevisionKey(revision));
      if (existingRevision && modelRevisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => modelRevisionKey(currentRevision) !== modelRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
    if (!isEndToEndMode) setStudioMode(LUMI_ASSISTANT_ID);
  }, [isEndToEndMode, setStudioMode]);

  const handleDesignRevisionsChange = useCallback((revisions: DesignRevisionArtifact[]) => {
    setHydratedDesignRevisions((currentRevisions) => (
      revisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const handleSketchRevisionsChange = useCallback((revisions: SketchRevisionArtifact[]) => {
    setHydratedSketchRevisions((currentRevisions) => (
      sketchRevisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const handleModelRevisionsChange = useCallback((revisions: ModelRevisionArtifact[]) => {
    setHydratedModelRevisions((currentRevisions) => (
      modelRevisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const clearViewerRevisions = useCallback(() => {
    designRequestVersionRef.current += 1;
    sketchRequestVersionRef.current += 1;
    modelRequestVersionRef.current += 1;
    setSignedRevisionSources(null);
    setSignedSketchRevisionSources([]);
    setSignedModelRevisionSources(null);
    setHydratedDesignRevisions([]);
    setLiveDesignRevisions([]);
    setHydratedSketchRevisions([]);
    setLiveSketchRevisions([]);
    setHydratedModelRevisions([]);
    setLiveModelRevisions([]);
    setSelectedRevisionKey(null);
    setSelectedSketchRevisionKey(null);
    setSelectedModelRevisionKey(null);
    setLumiModeOverride(null);
  }, []);

  const designRevisions = useMemo(
    () => mergeDesignRevisions(hydratedDesignRevisions, liveDesignRevisions),
    [hydratedDesignRevisions, liveDesignRevisions],
  );
  const latestRevision = useMemo(() => latestDesignRevision(designRevisions), [designRevisions]);
  const sketchRevisions = useMemo(
    () => mergeSketchRevisions(hydratedSketchRevisions, liveSketchRevisions),
    [hydratedSketchRevisions, liveSketchRevisions],
  );
  const latestSketchRevision = useMemo(() => getLatestSketchRevision(sketchRevisions), [sketchRevisions]);
  const modelRevisions = useMemo(
    () => mergeModelRevisions(hydratedModelRevisions, liveModelRevisions),
    [hydratedModelRevisions, liveModelRevisions],
  );
  const latestModelRevision = useMemo(() => getLatestModelRevision(modelRevisions), [modelRevisions]);
  const selectedRevision = useMemo(() => selectedRevisionKey
    ? designRevisions.find((revision) => revisionKey(revision) === selectedRevisionKey) ?? null
    : null, [designRevisions, selectedRevisionKey]);
  const selectedSketchRevision = useMemo(() => selectedSketchRevisionKey
    ? sketchRevisions.find((revision) => sketchRevisionKey(revision) === selectedSketchRevisionKey) ?? null
    : null, [sketchRevisions, selectedSketchRevisionKey]);
  const selectedModelRevision = useMemo(() => selectedModelRevisionKey
    ? modelRevisions.find((revision) => modelRevisionKey(revision) === selectedModelRevisionKey) ?? null
    : null, [modelRevisions, selectedModelRevisionKey]);
  const activeRevision = selectedRevision ?? latestRevision;
  const activeSketchRevision = selectedSketchRevision ?? latestSketchRevision;
  const activeModelRevision = selectedModelRevision ?? latestModelRevision;
  const activeRevisionKey = activeRevision ? revisionKey(activeRevision) : null;
  const activeSketchRevisionKey = activeSketchRevision ? sketchRevisionKey(activeSketchRevision) : null;
  const activeModelRevisionKey = activeModelRevision ? modelRevisionKey(activeModelRevision) : null;
  const revisionOptions = useMemo(() => revisionOptionsFromArtifacts(designRevisions), [designRevisions]);
  const signedSketchSourcesByKey = useMemo(() => {
    const sourcesByKey = new Map<string, SignedSketchRevisionSources>();
    for (const sources of signedSketchRevisionSources) {
      sourcesByKey.set(sources.key, sources);
    }
    return sourcesByKey;
  }, [signedSketchRevisionSources]);
  const sketchRevisionOptions = useMemo(() => (
    sketchRevisionOptionsFromArtifacts(sketchRevisions).map((revision) => ({
      ...revision,
      thumbnailUrl: signedSketchSourcesByKey.get(revision.key)?.imageSource?.url ?? null,
    }))
  ), [signedSketchSourcesByKey, sketchRevisions]);
  const modelRevisionOptions = useMemo(() => modelRevisionOptionsFromArtifacts(modelRevisions), [modelRevisions]);
  const viewerSource = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.viewerSource : null;
  const sourceCode = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.sourceCode : null;
  const sketchSource = activeSketchRevisionKey
    ? signedSketchSourcesByKey.get(activeSketchRevisionKey)?.imageSource ?? null
    : null;
  const modelSource = signedModelRevisionSources?.key === activeModelRevisionKey
    ? signedModelRevisionSources.modelSource
    : null;
  const activeStepExport = activeRevision?.exports.find(isStepExport) ?? null;
  const activeSketchExport = activeSketchRevision?.exports.find(isSketchImageExport) ?? null;
  const shouldShowSketchViewer = studioMode === SKETCH_ASSISTANT_ID || sketchSource !== null || (activeSketchRevision !== null && !activeRevision);
  const shareRevision: ShareRevision | null = activeRevision && activeStepExport ? {
    designId: activeRevision.designId,
    revisionNumber: activeRevision.revisionNumber,
    exportArtifact: activeStepExport,
  } : null;
  const shareSketchRevision: ShareRevision | null = activeSketchRevision && activeSketchExport ? {
    designId: activeSketchRevision.designId,
    revisionNumber: activeSketchRevision.revisionNumber,
    exportArtifact: activeSketchExport,
  } : null;

  const autoLumiViewerMode: LumiViewerMode = latestModelRevision
    ? (latestSketchRevision && latestSketchRevision.revisionNumber > latestModelRevision.revisionNumber
      ? "sketch"
      : "model")
    : "sketch";
  const latestLumiArtifactKey = [
    latestSketchRevision ? `s:${sketchRevisionKey(latestSketchRevision)}` : "",
    latestModelRevision ? `m:${modelRevisionKey(latestModelRevision)}` : "",
  ].join("|");
  const lumiViewerMode = lumiModeOverride?.atKey === latestLumiArtifactKey ? lumiModeOverride.mode : autoLumiViewerMode;
  const setLumiViewerMode = useCallback((mode: LumiViewerMode) => {
    setLumiModeOverride({ mode, atKey: latestLumiArtifactKey });
  }, [latestLumiArtifactKey]);

  useEffect(() => {
    designRequestVersionRef.current += 1;
    const snapshotVersion = designRequestVersionRef.current;

    if (!activeRevision || !activeRevisionKey) return;

    void getSignedRevisionSources(activeRevision, activeRevisionKey).then((sources) => {
      if (snapshotVersion !== designRequestVersionRef.current) return;
      setSignedRevisionSources(sources);
    });
  }, [activeRevision, activeRevisionKey]);

  useEffect(() => {
    sketchRequestVersionRef.current += 1;
    const snapshotVersion = sketchRequestVersionRef.current;

    const revisionsToSign = sketchRevisions.map((revision) => ({
      key: sketchRevisionKey(revision),
      revision,
    }));

    if (revisionsToSign.length === 0) return;

    void Promise.all(
      revisionsToSign.map(({ key, revision }) => getSignedSketchRevisionSources(revision, key)),
    ).then((sources) => {
      if (snapshotVersion !== sketchRequestVersionRef.current) return;
      setSignedSketchRevisionSources(sources.filter((source): source is SignedSketchRevisionSources => source !== null));
    });
  }, [sketchRevisions]);

  useEffect(() => {
    modelRequestVersionRef.current += 1;
    const snapshotVersion = modelRequestVersionRef.current;

    if (!activeModelRevision || !activeModelRevisionKey) return;

    void getSignedModelRevisionSources(activeModelRevision, activeModelRevisionKey).then((sources) => {
      if (snapshotVersion !== modelRequestVersionRef.current) return;
      setSignedModelRevisionSources(sources);
    });
  }, [activeModelRevision, activeModelRevisionKey]);

  return {
    activeModelRevisionKey,
    activeRevisionKey,
    activeSketchExport,
    activeSketchRevisionKey,
    clearViewerRevisions,
    handleDesignRevision,
    handleDesignRevisionsChange,
    handleModelRevision,
    handleModelRevisionsChange,
    handleSelectLatestModelRevision: () => setSelectedModelRevisionKey(null),
    handleSelectLatestRevision: () => setSelectedRevisionKey(null),
    handleSelectLatestSketchRevision: () => setSelectedSketchRevisionKey(null),
    handleSelectModelRevision: setSelectedModelRevisionKey,
    handleSelectRevision: setSelectedRevisionKey,
    handleSelectSketchRevision: setSelectedSketchRevisionKey,
    handleSketchRevision,
    handleSketchRevisionsChange,
    hasModel: modelRevisions.length > 0,
    hasSketch: sketchRevisions.length > 0,
    isLatestModelRevisionSelected: selectedModelRevisionKey === null || selectedModelRevision === null,
    isLatestRevisionSelected: selectedRevisionKey === null || selectedRevision === null,
    isLatestSketchRevisionSelected: selectedSketchRevisionKey === null || selectedSketchRevision === null,
    lumiViewerMode,
    modelRevisionOptions,
    modelSource,
    revisionOptions,
    setLumiViewerMode,
    shareRevision,
    shareSketchRevision,
    shouldShowSketchViewer,
    sketchRevisionOptions,
    sketchSource,
    sourceCode,
    viewerSource,
  };
}
