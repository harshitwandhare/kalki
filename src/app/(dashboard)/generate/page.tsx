"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Film,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tv2,
  Zap,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { usePersistentState } from "@/hooks/use-persistent-state";

// ─── Types ───────────────────────────────────────────────────────────────────

type Channel = {
  id: string;
  name: string;
  theme: string;
  language: string;
  status: string;
};

type AgentName =
  "DIRECTOR" | "SCREENWRITER" | "ARTIST" | "ANIMATOR" | "PRODUCER";

type AgentEvent = {
  reelId: string;
  agent: AgentName;
  action: string;
  phase: string;
  data?: unknown;
  timestamp: string;
};

type FormState = {
  channelId: string;
  prompt: string;
  language: string;
  style: string;
  duration: string;
  quality: string;
};

type GenerationState = {
  running: boolean;
  submitting: boolean;
  done: boolean;
  error: string;
  reelId: string;
  events: AgentEvent[];
  currentPhase: string;
  finalAssetUrl?: string; // To store the final video/image URL
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES = [
  "RESEARCHING",
  "SCRIPTING",
  "GENERATING_IMAGES",
  "ANIMATING",
  "POST_PRODUCTION",
  "COMPLETE",
] as const;

type Phase = (typeof PHASES)[number];

const PHASE_LABELS: Record<Phase, string> = {
  RESEARCHING: "Research",
  SCRIPTING: "Script",
  GENERATING_IMAGES: "Images",
  ANIMATING: "Animate",
  POST_PRODUCTION: "Post",
  COMPLETE: "Done",
};

const AGENT_CONFIG: Record<
  AgentName,
  { color: string; bg: string; border: string; dot: string; label: string }
> = {
  DIRECTOR: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    dot: "bg-orange-400",
    label: "Director",
  },
  SCREENWRITER: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
    label: "Screenwriter",
  },
  ARTIST: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    dot: "bg-purple-400",
    label: "Artist",
  },
  ANIMATOR: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    dot: "bg-green-400",
    label: "Animator",
  },
  PRODUCER: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-400",
    label: "Producer",
  },
};

const THEME_COLORS: Record<string, string> = {
  MYTHOLOGY: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  HISTORY: "bg-stone-500/15 text-stone-400 border-stone-500/30",
  SCIENCE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  TECHNOLOGY: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  FINANCE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  MOTIVATION: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMEDY: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  HORROR: "bg-red-500/15 text-red-400 border-red-500/30",
  ROMANCE: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  EDUCATION: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  SPORTS: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  GAMING: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  SPIRITUAL: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  NEWS: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  FOOD: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  TRAVEL: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  FASHION: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  DEFAULT: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const INITIAL_GENERATION_STATE: GenerationState = {
  running: false,
  submitting: false,
  done: false,
  error: "",
  reelId: "",
  events: [],
  currentPhase: "",
  finalAssetUrl: undefined,
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--:--";
  }
}

function getPhaseIndex(phase: string): number {
  const idx = PHASES.indexOf(phase as Phase);
  return idx === -1 ? 0 : idx;
}

function getPhaseProgress(phase: string): number {
  const idx = getPhaseIndex(phase);
  return Math.round((idx / (PHASES.length - 1)) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
    />
  );
}

function StyledSelect({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

function PhaseBar({ phase, running }: { phase: string; running: boolean }) {
  const progress = getPhaseProgress(phase);
  const currentIdx = getPhaseIndex(phase);
  const isDone = phase === "COMPLETE";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Pipeline Progress
        </span>
        <div className="flex items-center gap-2">
          {running && !isDone && (
            <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
          )}
          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span
            className={`text-xs font-mono tabular-nums ${isDone ? "text-emerald-400" : "text-orange-400"}`}
          >
            {progress}%
          </span>
        </div>
      </div>

      <Progress
        value={progress}
        className={`h-1.5 bg-zinc-800 ${isDone ? "[&>[data-slot=progress-indicator]]:bg-emerald-500" : "[&>[data-slot=progress-indicator]]:bg-orange-500"}`}
      />

      <div className="flex items-center justify-between">
        {PHASES.map((p, i) => {
          const isActive = i === currentIdx;
          const isPast = i < currentIdx;
          const isFuture = i > currentIdx;

          return (
            <div key={p} className="flex flex-col items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isPast || (isDone && isActive)
                    ? "bg-emerald-500"
                    : isActive && !isDone
                      ? "bg-orange-400 animate-pulse"
                      : "bg-zinc-700"
                } ${isFuture ? "opacity-40" : ""}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive && !isDone
                    ? "text-orange-400"
                    : isPast || (isDone && isActive)
                      ? "text-emerald-500"
                      : "text-zinc-700"
                }`}
              >
                {PHASE_LABELS[p]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false);
  const config = AGENT_CONFIG[event.agent] ?? AGENT_CONFIG.DIRECTOR;
  const hasData = event.data !== undefined && event.data !== null;
  const dataStr = hasData ? JSON.stringify(event.data, null, 2) : "";

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex-shrink-0 mt-1">
            <span
              className={`w-2 h-2 rounded-full inline-block ${config.dot}`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${config.color}`}>
                {config.label}
              </span>
              <span className="text-xs text-zinc-300 leading-snug">
                {event.action}
              </span>
            </div>
            {hasData && (
              <button
                onClick={() => setExpanded((x) => !x)}
                className={`flex items-center gap-1 mt-1 text-[11px] ${config.color} opacity-70 hover:opacity-100 transition-opacity`}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide data
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    View data
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-zinc-600 font-mono">
          <Clock className="w-3 h-3" />
          {formatTimestamp(event.timestamp)}
        </div>
      </div>

      {expanded && hasData && (
        <pre className="mt-2 text-[11px] text-zinc-400 bg-black/40 rounded-md p-2.5 overflow-x-auto max-h-48 font-mono leading-relaxed border border-zinc-800/80">
          {dataStr}
        </pre>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState("");

  const [form, setForm] = usePersistentState<FormState>("generate-form", {
    channelId: "",
    prompt: "",
    language: "ENGLISH",
    style: "CINEMATIC",
    duration: "60",
    quality: "HD_1080P",
  });

  const [genState, setGenState] = usePersistentState<GenerationState>(
    "generate-state",
    INITIAL_GENERATION_STATE,
  );

  const eventsEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // ── Fetch channels ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/channels");
        if (!res.ok) throw new Error("Failed to load channels");
        const data: Channel[] = await res.json();
        setChannels(data);
        if (data.length > 0 && !form.channelId) {
          setForm((f) => ({ ...f, channelId: data[0].id }));
        }
      } catch (err) {
        setChannelsError(
          err instanceof Error ? err.message : "Error loading channels",
        );
      } finally {
        setChannelsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reconnect to SSE on load if pipeline was running ───────────────────────
  useEffect(() => {
    if (!genState.running || !genState.reelId) return;

    // First check DB status — if it already finished while we were away, don't
    // reconnect SSE (the COMPLETE event won't fire again and we'd be stuck).
    (async () => {
      try {
        const res = await fetch(`/api/reels/${genState.reelId}`);
        if (res.ok) {
          const reel = await res.json();
          if (reel.status === "READY") {
            setGenState((prev) => ({
              ...prev,
              running: false,
              done: true,
              finalAssetUrl: reel.videoUrl ?? prev.finalAssetUrl,
            }));
            return;
          }
          if (reel.status === "FAILED") {
            setGenState((prev) => ({
              ...prev,
              running: false,
              error: "Pipeline failed. Check the library for details.",
            }));
            return;
          }
        }
      } catch {
        // Network error — fall through and reconnect SSE anyway
      }
      // Still running on the server — reconnect SSE to resume live feed
      connectSSE(genState.reelId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll events ──────────────────────────────────────────────────────
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [genState.events]);

  // ── SSE cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      sseRef.current?.close();
    };
  }, []);

  // ── Connect SSE ─────────────────────────────────────────────────────────────
  function connectSSE(id: string) {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const es = new EventSource(`/api/sse?reelId=${encodeURIComponent(id)}`);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: AgentEvent = JSON.parse(e.data);

        if (event.phase === "COMPLETE") {
          const finalAssetUrl =
            event.agent === "PRODUCER" &&
            event.action === "upload" &&
            typeof event.data === "object" &&
            event.data !== null &&
            "url" in event.data &&
            typeof (event.data as { url: unknown }).url === "string"
              ? (event.data as { url: string }).url
              : undefined;

          setGenState((prev) => ({
            ...prev,
            events: [...prev.events, event],
            currentPhase: event.phase,
            done: true,
            running: false,
            ...(finalAssetUrl !== undefined && { finalAssetUrl }),
          }));
          es.close();
        } else {
          setGenState((prev) => ({
            ...prev,
            events: [...prev.events, event],
            currentPhase: event.phase,
          }));
        }
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    es.addEventListener("error", (e) => {
      const eventData = JSON.parse((e as MessageEvent).data);
      setGenState((prev) => ({
        ...prev,
        running: false,
        submitting: false,
        error: `Pipeline error: ${eventData.message}`,
      }));
      es.close();
    });

    es.onerror = () => {
      // This can be flaky. Only stop 'running' if we are not 'done' yet.
      setGenState((prev) =>
        !prev.done
          ? { ...prev, running: false, error: "Connection to server lost." }
          : prev,
      );
      es.close();
    };
  }

  // ── Submit handler ──────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenState((prev) => ({ ...prev, error: "" }));

    if (!form.channelId) {
      setGenState((prev) => ({
        ...prev,
        error: "Please select a channel.",
      }));
      return;
    }
    if (!form.prompt.trim()) {
      setGenState((prev) => ({ ...prev, error: "Please enter a prompt." }));
      return;
    }

    setGenState((prev) => ({ ...prev, submitting: true }));

    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: form.channelId,
          prompt: form.prompt.trim(),
          language: form.language,
          style: form.style,
          duration: parseInt(form.duration, 10),
          quality: form.quality,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to start pipeline",
        );
      }

      const { reelId: newReelId } = await res.json();

      setGenState({
        ...INITIAL_GENERATION_STATE,
        reelId: newReelId,
        running: true,
        currentPhase: "RESEARCHING",
      });

      connectSSE(newReelId);
    } catch (err) {
      setGenState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Something went wrong",
        submitting: false,
      }));
    }
  }

  function handleFormChange(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function resetState() {
    setGenState(INITIAL_GENERATION_STATE);
  }

  const selectedChannel = channels.find((c) => c.id === form.channelId);
  const themeClass =
    THEME_COLORS[selectedChannel?.theme ?? ""] ?? THEME_COLORS.DEFAULT;

  const isFormDisabled = genState.submitting || genState.running;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Film className="w-6 h-6 text-orange-400" />
          Generate Reel
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Configure your reel and watch the AI pipeline build it in real-time.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT: Form ───────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 gap-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                Reel Configuration
              </CardTitle>
            </CardHeader>

            <CardContent>
              {genState.running ? (
                /* Pipeline running state — replace form with status */
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Pipeline Running</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Your session is saved. You can safely refresh this page.
                    </p>
                  </div>
                  {genState.reelId && (
                    <div className="text-[11px] font-mono text-zinc-700 bg-zinc-800 rounded px-2 py-1">
                      {genState.reelId}
                    </div>
                  )}
                  <div className="text-xs text-zinc-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Generation may take 2–5 minutes
                  </div>
                </div>
              ) : genState.done ? (
                /* Done state */
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Reel Complete!</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Your reel has been generated successfully.
                    </p>
                  </div>

                  {/* Final Asset Preview */}
                  {genState.finalAssetUrl && (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
                      <video
                        src={genState.finalAssetUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                    >
                      <Link href="/library">View in Library →</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                      onClick={resetState}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Reel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Main form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Prompt */}
                  <div>
                    <FormLabel>Prompt *</FormLabel>
                    <StyledTextarea
                      value={form.prompt}
                      onChange={(v) => handleFormChange("prompt", v)}
                      placeholder="What's this reel about? (2-3 lines)&#10;&#10;e.g. The story of how Lord Krishna revealed the Bhagavad Gita to Arjuna on the battlefield of Kurukshetra."
                      rows={4}
                      disabled={isFormDisabled}
                    />
                  </div>

                  {/* Channel */}
                  <div>
                    <FormLabel>Channel *</FormLabel>
                    {channelsLoading ? (
                      <div className="h-10 rounded-lg bg-zinc-800 animate-pulse" />
                    ) : channelsError ? (
                      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {channelsError}
                      </div>
                    ) : channels.length === 0 ? (
                      <div className="flex items-center justify-between gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2.5">
                        <span className="text-sm text-zinc-500">
                          No channels yet
                        </span>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="text-orange-400 hover:text-orange-300 h-auto py-0 px-0"
                        >
                          <Link href="/channels/new">Create one →</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <StyledSelect
                            value={form.channelId}
                            onChange={(v) => handleFormChange("channelId", v)}
                            disabled={isFormDisabled}
                          >
                            {channels.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.name}
                              </option>
                            ))}
                          </StyledSelect>
                        </div>
                        {selectedChannel && (
                          <div className="flex items-center gap-2">
                            <Tv2 className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="text-xs text-zinc-600">
                              {selectedChannel.name}
                            </span>
                            <Badge
                              className={`text-[10px] border ${themeClass}`}
                            >
                              {selectedChannel.theme}
                            </Badge>
                            <Badge className="text-[10px] bg-zinc-800 text-zinc-500 border-zinc-700">
                              {selectedChannel.language}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2-col grid for dropdowns */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Language */}
                    <div>
                      <FormLabel>Language</FormLabel>
                      <StyledSelect
                        value={form.language}
                        onChange={(v) => handleFormChange("language", v)}
                        disabled={isFormDisabled}
                      >
                        <option value="ENGLISH">English</option>
                        <option value="HINDI">Hindi</option>
                        <option value="HINGLISH">Hinglish</option>
                        <option value="MARATHI">Marathi</option>
                      </StyledSelect>
                    </div>

                    {/* Style */}
                    <div>
                      <FormLabel>Style</FormLabel>
                      <StyledSelect
                        value={form.style}
                        onChange={(v) => handleFormChange("style", v)}
                        disabled={isFormDisabled}
                      >
                        <option value="CINEMATIC">Cinematic</option>
                        <option value="CARTOON">Cartoon</option>
                        <option value="AI_GENERATED">AI Generated</option>
                        <option value="REALISTIC">Realistic</option>
                        <option value="ANIME">Anime</option>
                      </StyledSelect>
                    </div>

                    {/* Duration */}
                    <div>
                      <FormLabel>Duration</FormLabel>
                      <StyledSelect
                        value={form.duration}
                        onChange={(v) => handleFormChange("duration", v)}
                        disabled={isFormDisabled}
                      >
                        <option value="30">30 seconds</option>
                        <option value="45">45 seconds</option>
                        <option value="60">60 seconds</option>
                        <option value="75">75 seconds</option>
                        <option value="90">90 seconds</option>
                      </StyledSelect>
                    </div>

                    {/* Quality */}
                    <div>
                      <FormLabel>Quality</FormLabel>
                      <StyledSelect
                        value={form.quality}
                        onChange={(v) => handleFormChange("quality", v)}
                        disabled={isFormDisabled}
                      >
                        <option value="HD_1080P">HD 1080p</option>
                        <option value="FHD_2K">FHD 2K</option>
                      </StyledSelect>
                    </div>
                  </div>

                  {/* Error */}
                  {genState.error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {genState.error}
                    </div>
                  )}

                  {/* Submit */}
                  <div className="space-y-2 pt-1">
                    <Button
                      type="submit"
                      disabled={
                        isFormDisabled ||
                        channelsLoading ||
                        channels.length === 0
                      }
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white border-0 font-semibold h-10 disabled:opacity-50"
                    >
                      {genState.submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting Pipeline…
                        </>
                      ) : (
                        <>
                          <Film className="w-4 h-4" />
                          Generate Reel
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-zinc-600">
                      Generation may take 2–5 minutes
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Live Feed ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 gap-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      genState.running
                        ? "bg-orange-400 animate-pulse"
                        : genState.done
                          ? "bg-emerald-400"
                          : "bg-zinc-700"
                    }`}
                  />
                  Live Agent Feed
                </CardTitle>
                {genState.events.length > 0 && (
                  <Badge className="text-[10px] bg-zinc-800 text-zinc-500 border-zinc-700">
                    {genState.events.length} events
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Phase progress bar — shown when running or done */}
              {(genState.running || genState.done || genState.currentPhase) && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <PhaseBar
                    phase={genState.currentPhase || "RESEARCHING"}
                    running={genState.running}
                  />
                </div>
              )}

              {/* Done banner */}
              {genState.done && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-300">
                      Reel Ready!
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-7 text-xs"
                  >
                    <Link href="/library">View in Library →</Link>
                  </Button>
                </div>
              )}

              {/* Events log */}
              {genState.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-700 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Film className="w-5 h-5 opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">No events yet</p>
                    <p className="text-xs text-zinc-700 mt-0.5">
                      Submit the form to start the pipeline
                    </p>
                  </div>
                  {/* Agent legend */}
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {(
                      Object.entries(AGENT_CONFIG) as [
                        AgentName,
                        (typeof AGENT_CONFIG)[AgentName],
                      ][]
                    ).map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                        />
                        <span className={`text-[11px] ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                  {genState.events.map((ev, i) => (
                    <EventRow key={`${ev.reelId}-${i}`} event={ev} />
                  ))}
                  <div ref={eventsEndRef} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent legend when events are shown */}
          {genState.events.length > 0 && (
            <div className="flex flex-wrap gap-3 px-1">
              {(
                Object.entries(AGENT_CONFIG) as [
                  AgentName,
                  (typeof AGENT_CONFIG)[AgentName],
                ][]
              ).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
