"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ShareRevision } from "@/app/types/share-artifact";
import { trackEvent } from "@/app/lib/analytics/client";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import {
  latestDesignRevision,
  latestMarkdownRevision as getLatestMarkdownRevision,
  latestModelRevision as getLatestModelRevision,
  latestSketchRevision as getLatestSketchRevision,
} from "@/app/lib/design-revisions/design-artifacts";
import {
  isGlbExport,
  isMarkdownExport,
  isStepExport,
  isSketchImageExport,
  markdownRevisionKey,
  markdownRevisionListsMatch,
  markdownRevisionOptionsFromArtifacts,
  markdownRevisionsMatch,
  mergeDesignRevisions,
  mergeMarkdownRevisions,
  mergeModelRevisions,
  mergeSketchRevisions,
  modelRevisionKey,
  modelRevisionListsMatch,
  modelRevisionsMatch,
  revisionKey,
  revisionListsMatch,
  revisionOptionsFromArtifacts,
  revisionsMatch,
  signedMarkdownRevisionSources as getSignedMarkdownRevisionSources,
  signedModelRevisionSources as getSignedModelRevisionSources,
  signedSketchRevisionSources as getSignedSketchRevisionSources,
  signedRevisionSources as getSignedRevisionSources,
  sketchRevisionKey,
  sketchRevisionListsMatch,
  sketchRevisionOptionsFromArtifacts,
  sketchRevisionsMatch,
  type SignedMarkdownRevisionSources,
  type SignedModelRevisionSources,
  type SignedSketchRevisionSources,
  type SignedRevisionSources,
} from "@/app/lib/design-revisions/revision-sources";
import type {
  DesignRevisionArtifact,
  MarkdownRevisionArtifact,
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

export function useStudioRevisions(studioMode: AssistantId) {
  const [signedRevisionSources, setSignedRevisionSources] = useState<SignedRevisionSources | null>(null);
  const [signedSketchRevisionSources, setSignedSketchRevisionSources] = useState<SignedSketchRevisionSources[]>([]);
  const [signedModelRevisionSources, setSignedModelRevisionSources] = useState<SignedModelRevisionSources | null>(null);
  const [signedMarkdownRevisionSources, setSignedMarkdownRevisionSources] = useState<SignedMarkdownRevisionSources | null>(null);
  const [hydratedDesignRevisions, setHydratedDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [liveDesignRevisions, setLiveDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [hydratedSketchRevisions, setHydratedSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [liveSketchRevisions, setLiveSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [hydratedModelRevisions, setHydratedModelRevisions] = useState<ModelRevisionArtifact[]>([]);
  const [liveModelRevisions, setLiveModelRevisions] = useState<ModelRevisionArtifact[]>([]);
  const [hydratedMarkdownRevisions, setHydratedMarkdownRevisions] = useState<MarkdownRevisionArtifact[]>([]);
  const [liveMarkdownRevisions, setLiveMarkdownRevisions] = useState<MarkdownRevisionArtifact[]>([]);
  const [selectedRevisionKey, setSelectedRevisionKey] = useState<string | null>(null);
  const [selectedSketchRevisionKey, setSelectedSketchRevisionKey] = useState<string | null>(null);
  const [selectedModelRevisionKey, setSelectedModelRevisionKey] = useState<string | null>(null);
  const [selectedMarkdownRevisionKey, setSelectedMarkdownRevisionKey] = useState<string | null>(null);
  const [lumiModeOverride, setLumiModeOverride] = useState<{ mode: LumiViewerMode; atKey: string } | null>(null);
  const designRequestVersionRef = useRef(0);
  const sketchRequestVersionRef = useRef(0);
  const modelRequestVersionRef = useRef(0);
  const markdownRequestVersionRef = useRef(0);
  const trackedArtifactKeysRef = useRef(new Set<string>());

  const trackArtifactRevision = useCallback((
    artifactKind: "cad" | "model" | "sketch" | "markdown",
    revision: DesignRevisionArtifact | SketchRevisionArtifact | ModelRevisionArtifact | MarkdownRevisionArtifact,
  ) => {
    const key = `${artifactKind}:${revision.designId}:${revision.revisionNumber}`;
    if (trackedArtifactKeysRef.current.has(key)) return;
    trackedArtifactKeysRef.current.add(key);
    trackEvent("artifact_revision_received", {
      agent_id: studioMode,
      artifact_kind: artifactKind,
      design_id: revision.designId,
      export_count: revision.exports.length,
      revision_number: revision.revisionNumber,
    });
  }, [studioMode]);

  const handleDesignRevision = useCallback((revision: DesignRevisionArtifact) => {
    trackArtifactRevision("cad", revision);
    setLiveDesignRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => revisionKey(currentRevision) === revisionKey(revision));
      if (existingRevision && revisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => revisionKey(currentRevision) !== revisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
  }, [trackArtifactRevision]);

  const handleSketchRevision = useCallback((revision: SketchRevisionArtifact) => {
    trackArtifactRevision("sketch", revision);
    setLiveSketchRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => sketchRevisionKey(currentRevision) === sketchRevisionKey(revision));
      if (existingRevision && sketchRevisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => sketchRevisionKey(currentRevision) !== sketchRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
  }, [trackArtifactRevision]);

  const handleModelRevision = useCallback((revision: ModelRevisionArtifact) => {
    trackArtifactRevision("model", revision);
    setLiveModelRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => modelRevisionKey(currentRevision) === modelRevisionKey(revision));
      if (existingRevision && modelRevisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => modelRevisionKey(currentRevision) !== modelRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
  }, [trackArtifactRevision]);

  const handleMarkdownRevision = useCallback((revision: MarkdownRevisionArtifact) => {
    trackArtifactRevision("markdown", revision);
    setLiveMarkdownRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => markdownRevisionKey(currentRevision) === markdownRevisionKey(revision));
      if (existingRevision && markdownRevisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => markdownRevisionKey(currentRevision) !== markdownRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
  }, [trackArtifactRevision]);

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

  const handleMarkdownRevisionsChange = useCallback((revisions: MarkdownRevisionArtifact[]) => {
    setHydratedMarkdownRevisions((currentRevisions) => (
      markdownRevisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const clearViewerRevisions = useCallback(() => {
    designRequestVersionRef.current += 1;
    sketchRequestVersionRef.current += 1;
    modelRequestVersionRef.current += 1;
    markdownRequestVersionRef.current += 1;
    setSignedRevisionSources(null);
    setSignedSketchRevisionSources([]);
    setSignedModelRevisionSources(null);
    setSignedMarkdownRevisionSources(null);
    setHydratedDesignRevisions([]);
    setLiveDesignRevisions([]);
    setHydratedSketchRevisions([]);
    setLiveSketchRevisions([]);
    setHydratedModelRevisions([]);
    setLiveModelRevisions([]);
    setHydratedMarkdownRevisions([]);
    setLiveMarkdownRevisions([]);
    setSelectedRevisionKey(null);
    setSelectedSketchRevisionKey(null);
    setSelectedModelRevisionKey(null);
    setSelectedMarkdownRevisionKey(null);
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
  const viewableModelRevisions = useMemo(
    () => modelRevisions.filter((revision) => revision.exports.some(isGlbExport)),
    [modelRevisions],
  );
  const latestViewableModelRevision = useMemo(
    () => getLatestModelRevision(viewableModelRevisions),
    [viewableModelRevisions],
  );
  const markdownRevisions = useMemo(
    () => mergeMarkdownRevisions(hydratedMarkdownRevisions, liveMarkdownRevisions),
    [hydratedMarkdownRevisions, liveMarkdownRevisions],
  );
  const latestMarkdownRevision = useMemo(() => getLatestMarkdownRevision(markdownRevisions), [markdownRevisions]);
  const selectedRevision = useMemo(() => selectedRevisionKey
    ? designRevisions.find((revision) => revisionKey(revision) === selectedRevisionKey) ?? null
    : null, [designRevisions, selectedRevisionKey]);
  const selectedSketchRevision = useMemo(() => selectedSketchRevisionKey
    ? sketchRevisions.find((revision) => sketchRevisionKey(revision) === selectedSketchRevisionKey) ?? null
    : null, [sketchRevisions, selectedSketchRevisionKey]);
  const selectedModelRevision = useMemo(() => selectedModelRevisionKey
    ? modelRevisions.find((revision) => modelRevisionKey(revision) === selectedModelRevisionKey) ?? null
    : null, [modelRevisions, selectedModelRevisionKey]);
  const selectedMarkdownRevision = useMemo(() => selectedMarkdownRevisionKey
    ? markdownRevisions.find((revision) => markdownRevisionKey(revision) === selectedMarkdownRevisionKey) ?? null
    : null, [markdownRevisions, selectedMarkdownRevisionKey]);
  const activeRevision = selectedRevision ?? latestRevision;
  const activeSketchRevision = selectedSketchRevision ?? latestSketchRevision;
  const activeModelRevision = selectedModelRevision ?? latestModelRevision;
  const activeMarkdownRevision = selectedMarkdownRevision ?? latestMarkdownRevision;
  const activeRevisionKey = activeRevision ? revisionKey(activeRevision) : null;
  const activeSketchRevisionKey = activeSketchRevision ? sketchRevisionKey(activeSketchRevision) : null;
  const activeModelRevisionKey = activeModelRevision ? modelRevisionKey(activeModelRevision) : null;
  const activeMarkdownRevisionKey = activeMarkdownRevision ? markdownRevisionKey(activeMarkdownRevision) : null;
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
  const viewableSketchRevisions = useMemo(
    () => sketchRevisions.filter((revision) => revision.exports.some(isSketchImageExport)),
    [sketchRevisions],
  );
  const latestViewableSketchRevision = useMemo(
    () => getLatestSketchRevision(viewableSketchRevisions),
    [viewableSketchRevisions],
  );
  const modelRevisionOptions = useMemo(() => modelRevisionOptionsFromArtifacts(modelRevisions), [modelRevisions]);
  const markdownRevisionOptions = useMemo(() => markdownRevisionOptionsFromArtifacts(markdownRevisions), [markdownRevisions]);
  const viewerSource = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.viewerSource : null;
  const sourceCode = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.sourceCode : null;
  const sketchSource = activeSketchRevisionKey
    ? signedSketchSourcesByKey.get(activeSketchRevisionKey)?.imageSource ?? null
    : null;
  const modelSource = signedModelRevisionSources?.key === activeModelRevisionKey
    ? signedModelRevisionSources.modelSource
    : null;
  const markdownSource = signedMarkdownRevisionSources?.key === activeMarkdownRevisionKey
    ? signedMarkdownRevisionSources.markdownSource
    : null;
  const activeStepExport = activeRevision?.exports.find(isStepExport) ?? null;
  const activeSketchExport = activeSketchRevision?.exports.find(isSketchImageExport) ?? null;
  const activeMarkdownExport = activeMarkdownRevision?.exports.find(isMarkdownExport) ?? null;
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
  const shareMarkdownRevision: ShareRevision | null = activeMarkdownRevision && activeMarkdownExport ? {
    designId: activeMarkdownRevision.designId,
    revisionNumber: activeMarkdownRevision.revisionNumber,
    exportArtifact: activeMarkdownExport,
    relatedArtifacts: activeMarkdownRevision.exports.filter((artifact) => artifact !== activeMarkdownExport && isSketchImageExport(artifact)),
  } : null;

  const autoLumiViewerMode: LumiViewerMode = latestViewableModelRevision
    ? (latestViewableSketchRevision && latestViewableSketchRevision.revisionNumber > latestViewableModelRevision.revisionNumber
      ? "sketch"
      : "model")
    : "sketch";
  const latestLumiArtifactKey = [
    latestSketchRevision ? `s:${sketchRevisionKey(latestSketchRevision)}` : "",
    latestModelRevision ? `m:${modelRevisionKey(latestModelRevision)}` : "",
  ].join("|");
  const lumiViewerMode = lumiModeOverride?.atKey === latestLumiArtifactKey ? lumiModeOverride.mode : autoLumiViewerMode;
  const setLumiViewerMode = useCallback((mode: LumiViewerMode) => {
    trackEvent("viewer_mode_changed", {
      from_mode: lumiViewerMode,
      has_model: latestModelRevision !== null,
      has_sketch: latestSketchRevision !== null,
      to_mode: mode,
    });
    setLumiModeOverride({ mode, atKey: latestLumiArtifactKey });
  }, [latestLumiArtifactKey, latestModelRevision, latestSketchRevision, lumiViewerMode]);

  useEffect(() => {
    designRequestVersionRef.current += 1;
    const snapshotVersion = designRequestVersionRef.current;

    if (!activeRevision || !activeRevisionKey) return;

    void getSignedRevisionSources(activeRevision, activeRevisionKey)
      .then((sources) => {
        if (snapshotVersion !== designRequestVersionRef.current) return;
        setSignedRevisionSources(sources);
      })
      .catch(() => {
        if (snapshotVersion !== designRequestVersionRef.current) return;
        setSignedRevisionSources(null);
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
    )
      .then((sources) => {
        if (snapshotVersion !== sketchRequestVersionRef.current) return;
        setSignedSketchRevisionSources(sources.filter((source): source is SignedSketchRevisionSources => source !== null));
      })
      .catch(() => {
        if (snapshotVersion !== sketchRequestVersionRef.current) return;
        setSignedSketchRevisionSources([]);
      });
  }, [sketchRevisions]);

  useEffect(() => {
    modelRequestVersionRef.current += 1;
    const snapshotVersion = modelRequestVersionRef.current;

    if (!activeModelRevision || !activeModelRevisionKey) return;

    void getSignedModelRevisionSources(activeModelRevision, activeModelRevisionKey)
      .then((sources) => {
        if (snapshotVersion !== modelRequestVersionRef.current) return;
        setSignedModelRevisionSources(sources);
      })
      .catch(() => {
        if (snapshotVersion !== modelRequestVersionRef.current) return;
        setSignedModelRevisionSources(null);
      });
  }, [activeModelRevision, activeModelRevisionKey]);

  useEffect(() => {
    markdownRequestVersionRef.current += 1;
    const snapshotVersion = markdownRequestVersionRef.current;

    if (!activeMarkdownRevision || !activeMarkdownRevisionKey) return;

    void getSignedMarkdownRevisionSources(activeMarkdownRevision, activeMarkdownRevisionKey)
      .then((sources) => {
        if (snapshotVersion !== markdownRequestVersionRef.current) return;
        setSignedMarkdownRevisionSources(sources);
      })
      .catch(() => {
        if (snapshotVersion !== markdownRequestVersionRef.current) return;
        setSignedMarkdownRevisionSources(null);
      });
  }, [activeMarkdownRevision, activeMarkdownRevisionKey]);

  return {
    activeModelRevisionKey,
    activeMarkdownRevisionKey,
    activeRevisionKey,
    activeSketchExport,
    activeSketchRevisionKey,
    clearViewerRevisions,
    handleDesignRevision,
    handleDesignRevisionsChange,
    handleModelRevision,
    handleModelRevisionsChange,
    handleMarkdownRevision,
    handleMarkdownRevisionsChange,
    handleSelectLatestModelRevision: () => setSelectedModelRevisionKey(null),
    handleSelectLatestMarkdownRevision: () => setSelectedMarkdownRevisionKey(null),
    handleSelectLatestRevision: () => setSelectedRevisionKey(null),
    handleSelectLatestSketchRevision: () => setSelectedSketchRevisionKey(null),
    handleSelectMarkdownRevision: setSelectedMarkdownRevisionKey,
    handleSelectModelRevision: setSelectedModelRevisionKey,
    handleSelectRevision: setSelectedRevisionKey,
    handleSelectSketchRevision: setSelectedSketchRevisionKey,
    handleSketchRevision,
    handleSketchRevisionsChange,
    hasModel: viewableModelRevisions.length > 0,
    hasSketch: viewableSketchRevisions.length > 0,
    isLatestModelRevisionSelected: selectedModelRevisionKey === null || selectedModelRevision === null,
    isLatestMarkdownRevisionSelected: selectedMarkdownRevisionKey === null || selectedMarkdownRevision === null,
    isLatestRevisionSelected: selectedRevisionKey === null || selectedRevision === null,
    isLatestSketchRevisionSelected: selectedSketchRevisionKey === null || selectedSketchRevision === null,
    lumiViewerMode,
    markdownRevisionOptions,
    markdownSource,
    modelRevisionOptions,
    modelSource,
    revisionOptions,
    setLumiViewerMode,
    shareRevision,
    shareMarkdownRevision,
    shareSketchRevision,
    sketchRevisionOptions,
    sketchSource,
    sourceCode,
    viewerSource,
  };
}
