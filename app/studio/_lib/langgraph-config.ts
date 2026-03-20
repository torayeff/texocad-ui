export const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";

interface EngineEntry {
  assistantId: string;
  label: string;
  category: string;
  description: string;
  bestFor: string;
  url: string;
  status: boolean;
}

export const engines = {
  build123d: {
    assistantId: "build123_agent",
    label: "Build123d",
    category: "BREP CAD",
    description:
      "Feature-oriented parametric CAD for dimensioned mechanical parts and assemblies.",
    bestFor:
      "Structured engineering parts where explicit sketches, operations, and dimensions matter.",
    url: "https://build123d.readthedocs.io/en/latest/index.html",
    status: true,
  },
  cadquery: {
    assistantId: "cadquery_agent",
    label: "CadQuery",
    category: "BREP CAD",
    description:
      "Python-native parametric CAD with a concise API for programmable geometry.",
    bestFor:
      "Reusable scripts, configurable part families, and code-driven geometry generation.",
    url: "https://cadquery.readthedocs.io/en/latest/",
    status: true,
  },
  texosdf: {
    assistantId: "texosdf_agent",
    label: "TexoSDF",
    category: "SDF",
    description:
      "Signed distance field modeling for smooth implicit forms and mesh output.",
    bestFor:
      "Organic shapes, blends, field-based forms, and mesh-first experiments.",
    url: "https://github.com/torayeff/texosdf",
    status: true,
  },
  solidworks: {
    assistantId: "",
    label: "SolidWorks",
    category: "Native CAD",
    description:
      "Professional parametric CAD workflows for engineering handoff.",
    bestFor:
      "Teams that need SolidWorks-native modeling and downstream CAD exchange.",
    url: "https://www.solidworks.com/",
    status: false,
  },
  ansys: {
    assistantId: "",
    label: "Ansys",
    category: "CAD + Simulation",
    description:
      "Engineering simulation plus Ansys CAD tools such as SpaceClaim for analysis-ready models.",
    bestFor:
      "Stress, thermal, and simulation-led workflows that also need CAD cleanup or prep.",
    url: "https://www.ansys.com/",
    status: false,
  },
} as const satisfies Record<string, EngineEntry>;

export type EngineKey = keyof typeof engines;

export const DEFAULT_ENGINE: EngineKey = "build123d";
