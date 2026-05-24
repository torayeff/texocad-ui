"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ShareRevision } from "@/app/types/model-viewer";
import type { ShareSketchRevision } from "@/app/types/sketch-viewer";
import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import {
  latestDesignRevision,
  latestSketchRevision as getLatestSketchRevision,
} from "@/app/studio/_features/design-revisions/_lib/design-artifacts";
import {
  isStepExport,
  isSketchImageExport,
  mergeDesignRevisions,
  mergeSketchRevisions,
  revisionKey,
  revisionListsMatch,
  revisionOptionsFromArtifacts,
  revisionsMatch,
  signedSketchRevisionSources as getSignedSketchRevisionSources,
  signedRevisionSources as getSignedRevisionSources,
  sketchRevisionKey,
  sketchRevisionListsMatch,
  sketchRevisionOptionsFromArtifacts,
  sketchRevisionsMatch,
  type SignedSketchRevisionSources,
  type SignedRevisionSources,
} from "@/app/studio/_features/design-revisions/_lib/revision-sources";
import type {
  DesignRevisionArtifact,
  SketchRevisionArtifact,
} from "@/app/studio/_features/design-revisions/_types/design-artifact";

export function useStudioRevisions(studioMode: StudioAssistantId, setStudioMode: (mode: StudioAssistantId) => void) {
  const [signedRevisionSources, setSignedRevisionSources] = useState<SignedRevisionSources | null>(null);
  const [signedSketchRevisionSources, setSignedSketchRevisionSources] = useState<SignedSketchRevisionSources[]>([]);
  const [hydratedDesignRevisions, setHydratedDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [liveDesignRevisions, setLiveDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [hydratedSketchRevisions, setHydratedSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [liveSketchRevisions, setLiveSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [selectedRevisionKey, setSelectedRevisionKey] = useState<string | null>(null);
  const [selectedSketchRevisionKey, setSelectedSketchRevisionKey] = useState<string | null>(null);
  const designRequestVersionRef = useRef(0);
  const sketchRequestVersionRef = useRef(0);

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
    setStudioMode(SKETCH_ASSISTANT_ID);
  }, [setStudioMode]);

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

  const clearViewerRevisions = useCallback(() => {
    designRequestVersionRef.current += 1;
    sketchRequestVersionRef.current += 1;
    setSignedRevisionSources(null);
    setSignedSketchRevisionSources([]);
    setHydratedDesignRevisions([]);
    setLiveDesignRevisions([]);
    setHydratedSketchRevisions([]);
    setLiveSketchRevisions([]);
    setSelectedRevisionKey(null);
    setSelectedSketchRevisionKey(null);
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
  const selectedRevision = useMemo(() => selectedRevisionKey
    ? designRevisions.find((revision) => revisionKey(revision) === selectedRevisionKey) ?? null
    : null, [designRevisions, selectedRevisionKey]);
  const selectedSketchRevision = useMemo(() => selectedSketchRevisionKey
    ? sketchRevisions.find((revision) => sketchRevisionKey(revision) === selectedSketchRevisionKey) ?? null
    : null, [sketchRevisions, selectedSketchRevisionKey]);
  const activeRevision = selectedRevision ?? latestRevision;
  const activeSketchRevision = selectedSketchRevision ?? latestSketchRevision;
  const activeRevisionKey = activeRevision ? revisionKey(activeRevision) : null;
  const activeSketchRevisionKey = activeSketchRevision ? sketchRevisionKey(activeSketchRevision) : null;
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
  const viewerSource = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.viewerSource : null;
  const sourceCode = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.sourceCode : null;
  const sketchSource = activeSketchRevisionKey
    ? signedSketchSourcesByKey.get(activeSketchRevisionKey)?.imageSource ?? null
    : null;
  const activeStepExport = activeRevision?.exports.find(isStepExport) ?? null;
  const activeSketchExport = activeSketchRevision?.exports.find(isSketchImageExport) ?? null;
  const shouldShowSketchViewer = studioMode === SKETCH_ASSISTANT_ID || sketchSource !== null || (activeSketchRevision !== null && !activeRevision);
  const shareRevision: ShareRevision | null = activeRevision && activeStepExport ? {
    designId: activeRevision.designId,
    revisionNumber: activeRevision.revisionNumber,
    exportArtifact: activeStepExport,
  } : null;
  const shareSketchRevision: ShareSketchRevision | null = activeSketchRevision && activeSketchExport ? {
    designId: activeSketchRevision.designId,
    revisionNumber: activeSketchRevision.revisionNumber,
    exportArtifact: activeSketchExport,
  } : null;

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

  return {
    activeRevisionKey,
    activeSketchExport,
    activeSketchRevisionKey,
    clearViewerRevisions,
    handleDesignRevision,
    handleDesignRevisionsChange,
    handleSelectLatestRevision: () => setSelectedRevisionKey(null),
    handleSelectLatestSketchRevision: () => setSelectedSketchRevisionKey(null),
    handleSelectRevision: setSelectedRevisionKey,
    handleSelectSketchRevision: setSelectedSketchRevisionKey,
    handleSketchRevision,
    handleSketchRevisionsChange,
    isLatestRevisionSelected: selectedRevisionKey === null || selectedRevision === null,
    isLatestSketchRevisionSelected: selectedSketchRevisionKey === null || selectedSketchRevision === null,
    revisionOptions,
    shareRevision,
    shareSketchRevision,
    shouldShowSketchViewer,
    sketchRevisionOptions,
    sketchSource,
    sourceCode,
    viewerSource,
  };
}
