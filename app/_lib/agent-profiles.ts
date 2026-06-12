import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import {
  CLARI_ASSISTANT_ID,
  FORMA_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import { SITE_ROUTES } from "@/app/lib/site";

export interface AgentProfile {
  name: string;
  role: string;
  /** Short card description. */
  tagline: string;
  /** Longer profile introduction shown in the dialog. */
  bio: string;
  image: string;
  /** Compact skill chips on the card. */
  cardSkills: readonly string[];
  /** Full skill chips in the dialog. */
  coreSkills: readonly string[];
  outputs: readonly string[];
  bestFor: readonly string[];
  /** Studio deep link; null while the agent is not yet live. */
  startHref: string | null;
}

function studioAgentHref(assistantId: AssistantId): string {
  return `${SITE_ROUTES.studio}?${AGENT_QUERY_PARAM}=${assistantId}`;
}

export const AGENT_PROFILES: readonly AgentProfile[] = [
  {
    name: "Clari",
    role: "Requirements engineer",
    tagline:
      "Frames product goals, maps requirements, defines constraints, and writes clear success criteria.",
    bio: "Clari shapes early product intent into a concise engineering brief with scope, constraints, and acceptance criteria.",
    image: "/images/agents/clari.png",
    cardSkills: ["Briefs", "Scope", "PRDs", "Criteria"],
    coreSkills: [
      "Product Briefs",
      "Requirement Maps",
      "Scope Definition",
      "Constraint Sets",
      "Acceptance Criteria",
      "PRD Drafting",
      "User Stories",
      "Decision Records",
      "Handoff Notes",
    ],
    outputs: [
      "Engineering product brief",
      "Prioritized requirement map",
      "Acceptance criteria list",
    ],
    bestFor: [
      "Early project definition",
      "Stakeholder alignment",
      "Concept handoff planning",
    ],
    startHref: studioAgentHref(CLARI_ASSISTANT_ID),
  },
  {
    name: "Lumi",
    role: "Concept engineer",
    tagline:
      "Explores visual directions, styling options, form studies, and early 3D product concepts.",
    bio: "Lumi turns loose ideas and references into visual directions, concept sketches, and early 3D models for review.",
    image: "/images/agents/lumi.png",
    cardSkills: ["Ideas", "Sketch", "Style", "3D"],
    coreSkills: [
      "Ideation",
      "Concept Sketches",
      "Early 3D Models",
      "Style Directions",
      "Visual Studies",
      "Design Variations",
      "Reference Mapping",
      "Form Exploration",
    ],
    outputs: [
      "Concept sketch boards",
      "Early 3D model studies",
      "Style direction options",
    ],
    bestFor: [
      "Product form exploration",
      "Visual direction choices",
      "Pre-CAD concept review",
    ],
    startHref: studioAgentHref(LUMI_ASSISTANT_ID),
  },
  {
    name: "Forma",
    role: "CAD engineer",
    tagline:
      "Creates precise CAD parts, assembly layouts, manufacturing details, and revision-ready geometry.",
    bio: "Forma turns an approved direction into precise, editable CAD geometry, assemblies, and manufacturing-ready parts.",
    image: "/images/agents/forma.png",
    cardSkills: ["CAD", "Parts", "DFM", "STEP"],
    coreSkills: [
      "Parametric CAD",
      "Assembly Layouts",
      "BREP Modeling",
      "Tolerance Plans",
      "DFM Checks",
      "STEP Export",
      "Revision Loops",
      "Part Detailing",
    ],
    outputs: [
      "Editable CAD part files",
      "STEP assembly packages",
      "Manufacturing detail set",
    ],
    bestFor: [
      "Prototype-ready modeling",
      "Manufacturing review",
      "Production CAD handoff",
    ],
    startHref: studioAgentHref(FORMA_ASSISTANT_ID),
  },
  {
    name: "Nexis",
    role: "Simulation engineer",
    tagline:
      "Tests designs, processes, and real-world performance before prototyping.",
    bio: "Nexis evaluates CAD-ready concepts and production workflows with simulation plans, load cases, robot motion studies, and risk findings.",
    image: "/images/agents/nexis.png",
    cardSkills: ["FEA", "Process", "Robots", "Risk"],
    coreSkills: [
      "Structural Analysis",
      "Load Cases",
      "Motion Simulation",
      "Process Simulation",
      "Robotic Simulation",
      "Design Optimization",
      "Feasibility Review",
      "Risk Reports",
    ],
    outputs: [
      "Simulation setup plan",
      "Load and stress findings",
      "Process and simulation report",
    ],
    bestFor: [
      "Pre-prototype validation",
      "Process simulation",
      "Performance risk checks",
    ],
    startHref: null,
  },
];
