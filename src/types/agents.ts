export type AgentPhase =
  | "IDLE"
  | "RESEARCHING"
  | "SCRIPTING"
  | "GENERATING_IMAGES"
  | "ANIMATING"
  | "POST_PRODUCTION"
  | "COMPLETE"
  | "ERROR";

export interface AgentEvent {
  reelId: string;
  agent: "DIRECTOR" | "SCREENWRITER" | "ARTIST" | "ANIMATOR" | "PRODUCER";
  action: string;
  phase: AgentPhase;
  data?: unknown;
  thinkingBlock?: string;
  timestamp: string;
}

export interface PipelineState {
  reelId: string;
  channelId: string;
  prompt: string;
  phase: AgentPhase;
  script?: ScriptOutput;
  sceneImages?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  ytMetadata?: YouTubeMetadata;
  error?: string;
  logs: AgentEvent[];
}

export interface ScriptOutput {
  title: string;
  hook: string; // <2s attention hook
  scenes: Scene[];
  emotionalTags: string[];
  targetDuration: number;
  audioStyle: string;
  voiceoverScript: string;
}

export interface Scene {
  id: number;
  description: string;
  visualPrompt: string;
  duration: number;
  cameraAngle: string;
  characters: string[];
  worldSetting: string;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  category: string;
  audienceAge: string;
  thumbnailPrompt: string;
}
