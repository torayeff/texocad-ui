import { AGENT_CONFIGS, agentProfileStartHref } from "@/app/lib/chat/agent-config";

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

export const AGENT_PROFILES: readonly AgentProfile[] = AGENT_CONFIGS
  .filter((agent) => agent.profile && agent.avatarUrl)
  .map((agent) => ({
    name: agent.name,
    role: agent.role,
    tagline: agent.profile!.tagline,
    bio: agent.profile!.bio,
    image: agent.avatarUrl!,
    cardSkills: agent.profile!.cardSkills,
    coreSkills: agent.profile!.coreSkills,
    outputs: agent.profile!.outputs,
    bestFor: agent.profile!.bestFor,
    startHref: agentProfileStartHref(agent),
  }));
