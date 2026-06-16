import { AGENT_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import {
  CAD_ASSISTANT_ID,
  CLARI_ASSISTANT_ID,
  FORMA_ASSISTANT_ID,
  LUMI_ASSISTANT_ID,
  SKETCH_ASSISTANT_ID,
  type AssistantId,
} from "@/app/lib/chat/langgraph-config";
import { SITE_ROUTES } from "@/app/lib/site";

export interface AgentExamplePrompt {
  description: string;
  label: string;
  prompt: string;
}

export interface AgentGreeting {
  alt: string;
  avatarUrl: string;
  description: string;
  title: string;
}

export interface AgentProfileDetails {
  bestFor: readonly string[];
  bio: string;
  cardSkills: readonly string[];
  coreSkills: readonly string[];
  outputs: readonly string[];
  tagline: string;
}

export interface AgentConfig {
  avatarUrl?: string;
  description: string;
  examples?: readonly AgentExamplePrompt[];
  greeting?: AgentGreeting;
  group: "primary" | "legacy";
  isComingSoon?: boolean;
  isLegacy?: boolean;
  key: string;
  mode: AssistantId | null;
  name: string;
  profile?: AgentProfileDetails;
  role: string;
}

function studioAgentHref(assistantId: AssistantId): string {
  return `${SITE_ROUTES.studio}?${AGENT_QUERY_PARAM}=${assistantId}`;
}

export const AGENT_CONFIGS: readonly AgentConfig[] = [
  {
    avatarUrl: "/images/agents/clari.png",
    description: "Briefs with requirements and success criteria.",
    greeting: {
      alt: "Clari",
      avatarUrl: "/images/agents/clari.png",
      description: "I turn rough ideas into clear, complete briefs. Tell me what you want to build; I'll ask focused questions, capture requirements, constraints, and success criteria, and deliver a brief ready to hand off.",
      title: "Hi, I'm Clari",
    },
    group: "primary",
    key: "clari",
    mode: CLARI_ASSISTANT_ID,
    name: "Clari",
    profile: {
      bestFor: [
        "Early project definition",
        "Stakeholder alignment",
        "Concept handoff planning",
      ],
      bio: "Clari shapes early product intent into a concise engineering brief with scope, constraints, and acceptance criteria.",
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
      tagline: "Frames product goals, maps requirements, defines constraints, and writes clear success criteria.",
    },
    role: "Requirements engineer",
  },
  {
    avatarUrl: "/images/agents/lumi.png",
    description: "Images and GLB-ready 3D assets.",
    greeting: {
      alt: "Lumi",
      avatarUrl: "/images/agents/lumi.png",
      description: "I turn ideas into 3D assets from prompts, sketches, or reference images. Give me the object, style, and level of detail; I'll create images, export GLB files, and iterate revisions with you.",
      title: "Hi, I'm Lumi",
    },
    group: "primary",
    key: "lumi",
    mode: LUMI_ASSISTANT_ID,
    name: "Lumi",
    profile: {
      bestFor: [
        "Product form exploration",
        "Visual direction choices",
        "Pre-CAD concept review",
      ],
      bio: "Lumi turns loose ideas and references into visual directions, concept sketches, and early 3D models for review.",
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
      tagline: "Explores visual directions, styling options, form studies, and early 3D product concepts.",
    },
    role: "Concept engineer",
  },
  {
    avatarUrl: "/images/agents/forma.png",
    description: "CAD parts and STEP-ready assemblies.",
    greeting: {
      alt: "Forma",
      avatarUrl: "/images/agents/forma.png",
      description: "I turn requirements into precise parametric CAD for parts and assemblies. Give me dimensions, interfaces, constraints, and function; I'll build CAD, export STEP files, and iterate revisions with you.",
      title: "Hi, I'm Forma",
    },
    group: "primary",
    key: "forma",
    mode: FORMA_ASSISTANT_ID,
    name: "Forma",
    profile: {
      bestFor: [
        "Prototype-ready modeling",
        "Manufacturing review",
        "Production CAD handoff",
      ],
      bio: "Forma turns an approved direction into precise, editable CAD geometry, assemblies, and manufacturing-ready parts.",
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
      tagline: "Creates precise CAD parts, assembly layouts, manufacturing details, and revision-ready geometry.",
    },
    role: "CAD engineer",
  },
  {
    avatarUrl: "/images/agents/nexis.png",
    description: "Tests designs, processes, and performance.",
    group: "primary",
    isComingSoon: true,
    key: "nexis",
    mode: null,
    name: "Nexis",
    profile: {
      bestFor: [
        "Pre-prototype validation",
        "Process simulation",
        "Performance risk checks",
      ],
      bio: "Nexis evaluates CAD-ready concepts and production workflows with simulation plans, load cases, robot motion studies, and risk findings.",
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
      tagline: "Tests designs, processes, and real-world performance before prototyping.",
    },
    role: "Simulation engineer",
  },
  {
    description: "Concept sketches.",
    examples: [
      {
        description: "Clinic check-in device.",
        label: "Kiosk concept",
        prompt: "Sketch a compact tabletop check-in kiosk for a small clinic. Show a tilted touchscreen, stable weighted base, privacy shield around the display, subtle cable exit at the rear, soft rounded corners, and a clean medical-product aesthetic.",
      },
      {
        description: "Workshop measuring tool.",
        label: "Tool concept",
        prompt: "Generate a visual concept for a handheld workshop measuring tool. Show a durable rubberized grip, small top display, thumb buttons, a protected measuring probe, visible part seams for assembly, and a rugged but simple industrial design.",
      },
    ],
    group: "legacy",
    isLegacy: true,
    key: "sketch",
    mode: SKETCH_ASSISTANT_ID,
    name: "Sketch",
    role: "Legacy image agent",
  },
  {
    description: "BREP CAD designs.",
    examples: [
      {
        description: "Wall-mounted sensor case.",
        label: "Sensor enclosure",
        prompt: "Design a wall-mounted enclosure for a small temperature and humidity sensor. Include a removable front cover, ventilation slots that protect the electronics, two internal PCB standoffs, rear screw mounting holes, 2 mm wall thickness, rounded corners, and dimensions around 70 mm x 45 mm x 22 mm.",
      },
      {
        description: "Under-desk cable mount.",
        label: "Cable bracket",
        prompt: "Create an under-desk cable management bracket for 3D printing. Include a flat mounting flange with two countersunk screw holes, a rounded open channel for a bundle of cables, a small retaining lip, 3 mm wall thickness, chamfered edges, and enough clearance for easy cable insertion.",
      },
    ],
    group: "legacy",
    isLegacy: true,
    key: "cad",
    mode: CAD_ASSISTANT_ID,
    name: "CAD",
    role: "Legacy CAD agent",
  },
];

export const PRIMARY_AGENT_CONFIGS = AGENT_CONFIGS.filter((agent) => agent.group === "primary");
export const LEGACY_AGENT_CONFIGS = AGENT_CONFIGS.filter((agent) => agent.group === "legacy");
export const RUNNABLE_AGENT_CONFIGS = AGENT_CONFIGS.filter((agent) => agent.mode !== null);

export function agentConfigForMode(mode: AssistantId): AgentConfig {
  const config = RUNNABLE_AGENT_CONFIGS.find((agent) => agent.mode === mode);
  if (!config) {
    throw new Error(`Unknown assistant mode: ${mode}`);
  }
  return config;
}

export function agentLabelForMode(mode: AssistantId) {
  const config = agentConfigForMode(mode);
  return config.isLegacy ? `${config.name} (Legacy)` : config.name;
}

export function agentProfileStartHref(agent: AgentConfig) {
  return agent.mode ? studioAgentHref(agent.mode) : null;
}
