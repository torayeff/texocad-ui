"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  latestModelRevision as getLatestModelRevision,
  latestSketchRevision as getLatestSketchRevision,
} from "@/app/lib/design-revisions/design-artifacts";
import {
  isGlbExport,
  isSketchImageExport,
  mergeModelRevisions,
  mergeSketchRevisions,
  modelRevisionKey,
  modelRevisionListsMatch,
  modelRevisionsMatch,
  signedModelRevisionSources as getSignedModelRevisionSources,
  signedSketchRevisionSources as getSignedSketchRevisionSources,
  sketchRevisionKey,
  sketchRevisionListsMatch,
  sketchRevisionOptionsFromArtifacts,
  sketchRevisionsMatch,
  type SignedModelRevisionSources,
  type SignedSketchRevisionSources,
} from "@/app/lib/design-revisions/revision-sources";
import type {
  ModelRevisionArtifact,
  SketchRevisionArtifact,
} from "@/app/types/design-artifact";
import type { ViewerRevisionOption } from "@/app/types/model-viewer";

export type LumiViewerMode = "sketch" | "model";

function modelOptionsFromArtifacts(revisions: ModelRevisionArtifact[]): ViewerRevisionOption[] {
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

export function useLumiRevisions() {
  const [hydratedSketchRevisions, setHydratedSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [liveSketchRevisions, setLiveSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [hydratedModelRevisions, setHydratedModelRevisions] = useState<ModelRevisionArtifact[]>([]);
  const [liveModelRevisions, setLiveModelRevisions] = useState<ModelRevisionArtifact[]>([]);
  const [signedSketchSources, setSignedSketchSources] = useState<SignedSketchRevisionSources[]>([]);
  const [signedModelSources, setSignedModelSources] = useState<SignedModelRevisionSources | null>(null);
  const [selectedSketchRevisionKey, setSelectedSketchRevisionKey] = useState<string | null>(null);
  const [selectedModelRevisionKey, setSelectedModelRevisionKey] = useState<string | null>(null);
  const [modeOverride, setModeOverride] = useState<{ mode: LumiViewerMode; atKey: string } | null>(null);
  const sketchRequestVersionRef = useRef(0);
  const modelRequestVersionRef = useRef(0);

  const handleSketchRevision = useCallback((revision: SketchRevisionArtifact) => {
    setLiveSketchRevisions((currentRevisions) => {
      const existing = currentRevisions.find((current) => sketchRevisionKey(current) === sketchRevisionKey(revision));
      if (existing && sketchRevisionsMatch(existing, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((current) => sketchRevisionKey(current) !== sketchRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
  }, []);

  const handleModelRevision = useCallback((revision: ModelRevisionArtifact) => {
    setLiveModelRevisions((currentRevisions) => {
      const existing = currentRevisions.find((current) => modelRevisionKey(current) === modelRevisionKey(revision));
      if (existing && modelRevisionsMatch(existing, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((current) => modelRevisionKey(current) !== modelRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
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
    sketchRequestVersionRef.current += 1;
    modelRequestVersionRef.current += 1;
    setHydratedSketchRevisions([]);
    setLiveSketchRevisions([]);
    setHydratedModelRevisions([]);
    setLiveModelRevisions([]);
    setSignedSketchSources([]);
    setSignedModelSources(null);
    setSelectedSketchRevisionKey(null);
    setSelectedModelRevisionKey(null);
    setModeOverride(null);
  }, []);

  const sketchRevisions = useMemo(
    () => mergeSketchRevisions(hydratedSketchRevisions, liveSketchRevisions),
    [hydratedSketchRevisions, liveSketchRevisions],
  );
  const modelRevisions = useMemo(
    () => mergeModelRevisions(hydratedModelRevisions, liveModelRevisions),
    [hydratedModelRevisions, liveModelRevisions],
  );
  const latestSketchRevision = useMemo(() => getLatestSketchRevision(sketchRevisions), [sketchRevisions]);
  const latestModelRevision = useMemo(() => getLatestModelRevision(modelRevisions), [modelRevisions]);

  const selectedSketchRevision = useMemo(() => selectedSketchRevisionKey
    ? sketchRevisions.find((revision) => sketchRevisionKey(revision) === selectedSketchRevisionKey) ?? null
    : null, [sketchRevisions, selectedSketchRevisionKey]);
  const selectedModelRevision = useMemo(() => selectedModelRevisionKey
    ? modelRevisions.find((revision) => modelRevisionKey(revision) === selectedModelRevisionKey) ?? null
    : null, [modelRevisions, selectedModelRevisionKey]);

  const activeSketchRevision = selectedSketchRevision ?? latestSketchRevision;
  const activeModelRevision = selectedModelRevision ?? latestModelRevision;
  const activeSketchRevisionKey = activeSketchRevision ? sketchRevisionKey(activeSketchRevision) : null;
  const activeModelRevisionKey = activeModelRevision ? modelRevisionKey(activeModelRevision) : null;

  // The newest artifact (by revision number within the design) decides the
  // automatic tab; a manual tab choice survives only until the next artifact.
  const autoViewerMode: LumiViewerMode = latestModelRevision
    ? (latestSketchRevision && latestSketchRevision.revisionNumber > latestModelRevision.revisionNumber
      ? "sketch"
      : "model")
    : "sketch";
  const latestArtifactKey = [
    latestSketchRevision ? `s:${sketchRevisionKey(latestSketchRevision)}` : "",
    latestModelRevision ? `m:${modelRevisionKey(latestModelRevision)}` : "",
  ].join("|");
  const viewerMode = modeOverride?.atKey === latestArtifactKey ? modeOverride.mode : autoViewerMode;
  const setViewerMode = useCallback((mode: LumiViewerMode) => {
    setModeOverride({ mode, atKey: latestArtifactKey });
  }, [latestArtifactKey]);

  const signedSketchSourcesByKey = useMemo(() => {
    const sourcesByKey = new Map<string, SignedSketchRevisionSources>();
    for (const sources of signedSketchSources) {
      sourcesByKey.set(sources.key, sources);
    }
    return sourcesByKey;
  }, [signedSketchSources]);

  const sketchRevisionOptions = useMemo(() => (
    sketchRevisionOptionsFromArtifacts(sketchRevisions).map((revision) => ({
      ...revision,
      thumbnailUrl: signedSketchSourcesByKey.get(revision.key)?.imageSource?.url ?? null,
    }))
  ), [signedSketchSourcesByKey, sketchRevisions]);
  const modelRevisionOptions = useMemo(() => modelOptionsFromArtifacts(modelRevisions), [modelRevisions]);

  const sketchSource = activeSketchRevisionKey
    ? signedSketchSourcesByKey.get(activeSketchRevisionKey)?.imageSource ?? null
    : null;
  const modelSource = signedModelSources?.key === activeModelRevisionKey
    ? signedModelSources.modelSource
    : null;
  const activeSketchExport = activeSketchRevision?.exports.find(isSketchImageExport) ?? null;

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
      setSignedSketchSources(sources.filter((source): source is SignedSketchRevisionSources => source !== null));
    });
  }, [sketchRevisions]);

  useEffect(() => {
    modelRequestVersionRef.current += 1;
    const snapshotVersion = modelRequestVersionRef.current;

    if (!activeModelRevision || !activeModelRevisionKey) return;

    void getSignedModelRevisionSources(activeModelRevision, activeModelRevisionKey).then((sources) => {
      if (snapshotVersion !== modelRequestVersionRef.current) return;
      setSignedModelSources(sources);
    });
  }, [activeModelRevision, activeModelRevisionKey]);

  return {
    activeModelRevisionKey,
    activeSketchExport,
    activeSketchRevisionKey,
    clearViewerRevisions,
    handleModelRevision,
    handleModelRevisionsChange,
    handleSelectLatestModelRevision: () => setSelectedModelRevisionKey(null),
    handleSelectLatestSketchRevision: () => setSelectedSketchRevisionKey(null),
    handleSelectModelRevision: setSelectedModelRevisionKey,
    handleSelectSketchRevision: setSelectedSketchRevisionKey,
    handleSketchRevision,
    handleSketchRevisionsChange,
    hasModel: modelRevisions.length > 0,
    hasSketch: sketchRevisions.length > 0,
    isLatestModelRevisionSelected: selectedModelRevisionKey === null || selectedModelRevision === null,
    isLatestSketchRevisionSelected: selectedSketchRevisionKey === null || selectedSketchRevision === null,
    modelRevisionOptions,
    modelSource,
    setViewerMode,
    sketchRevisionOptions,
    sketchSource,
    viewerMode,
  };
}
