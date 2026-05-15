import * as THREE from "three";

import { collectStandardMaterials } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import type { BrowserNodeEntry } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import type { HighlightState } from "@/app/components/model-viewer/_lib/model-viewer-picking";

const browserSelectionColor = new THREE.Color(0x60a5fa);
const browserSelectionEmissive = new THREE.Color(0x1d4ed8);

export function clearBrowserHighlight(
  clearHighlight: () => void,
  selectedHighlights: HighlightState[],
) {
  clearHighlight();

  for (const highlighted of selectedHighlights) {
    highlighted.material.color.copy(highlighted.color);
    highlighted.material.emissive.copy(highlighted.emissive);
  }
}

export function applyBrowserHighlight(entry: BrowserNodeEntry) {
  const materials = collectStandardMaterials(entry.meshes);
  const highlights = materials.map((material) => ({
    material,
    color: material.color.clone(),
    emissive: material.emissive.clone(),
  }));

  for (const material of materials) {
    material.color.copy(browserSelectionColor);
    material.emissive.copy(browserSelectionEmissive);
  }

  return highlights;
}
