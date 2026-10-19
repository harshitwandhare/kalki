"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clapperboard,
  PenLine,
  Palette,
  Play,
  Package,
  RefreshCw,
  AlertTriangle,
  Clock,
  Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentName =
  "DIRECTOR" | "SCREENWRITER" | "ARTIST" | "ANIMATOR" | "PRODUCER";

type AgentLog = {
  id: string;
  reelId: string;
  agent: AgentName;
  phase: string;
  action: string;
  data: unknown;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<
  AgentName,
  {
    label: string;
    model: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    dot: string;
    rowBg: string;
  }
> = {
  DIRECTOR: {
    label: "Director",
    model: "gemini-2.5-pro",
    icon: Clapperboard,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    dot: "bg-orange-400",
    rowBg: "bg-orange-500/5 border-orange-500/15",
  },
  SCREENWRITER: {
    label: "Screenwriter",
    model: "gemini-2.5-pro",
    icon: PenLine,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
    rowBg: "bg-blue-500/5 border-blue-500/15",
  },
  ARTIST: {
    label: "Artist",
    model: "flux-1.1-pro",
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    dot: "bg-purple-400",
    rowBg: "bg-purple-500/5 border-purple-500/15",
  },
  ANIMATOR: {
    label: "Animator",
    model: "seedance-2.0",
    icon: Play,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    dot: "bg-green-400",
    rowBg: "bg-green-500/5 border-green-500/15",
  },
  PRODUCER: {
    label: "Producer",
    model: "ffmpeg",
    icon: Package,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-400",
    rowBg: "bg-yellow-500/5 border-yellow-500/15",
  },
};

const AGENT_ORDER: AgentName[] = [
  "DIRECTOR",
  "SCREENWRITER",
  "ARTIST",
  "ANIMATOR",
  "PRODUCER",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function truncatePrompt(str: string, max = 60): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

// ─── Agent Status Card ────────────────────────────────────────────────────────

function AgentStatusCard({
  agentName,
  logs,
}: {
  agentName: AgentName;
  logs: AgentLog[];
}) {
  const cfg = AGENT_CONFIG[agentName];
  const Icon = cfg.icon;
  const lastLog = logs.find((l) => l.agent === agentName);
  const lastAction = lastLog?.action ?? "idle";
  const isIdle = !lastLog;

  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors`}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <Badge
                className={`text-xs border flex-shrink-0 ${
                  isIdle
                    ? "bg-zinc-800 text-zinc-500 border-zinc-700"
                    : `${cfg.bg} ${cfg.color} ${cfg.border}`
                }`}
              >
                {isIdle ? (
                  "idle"
                ) : (
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`}
                    />
                    active
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs font-mono text-zinc-600 mt-0.5">
              {cfg.model}
            </p>
            <p className="text-xs text-zinc-400 mt-1.5 truncate">
              {lastAction}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: AgentLog }) {
  const cfg = AGENT_CONFIG[log.agent] ?? AGENT_CONFIG.DIRECTOR;

  return (
    <tr
      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors`}
    >
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className={`text-xs font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-4">
        <span className="text-xs text-zinc-300">{log.action}</span>
      </td>
      <td className="py-2.5 px-4 max-w-xs">
        <span className="text-xs text-zinc-500 truncate block">
          {truncatePrompt(log.reelId)}
        </span>
      </td>
      <td className="py-2.5 px-4 text-right">
        <span className="flex items-center justify-end gap-1 text-xs text-zinc-600 font-mono">
          <Clock className="w-3 h-3" />
          {formatTimestamp(log.createdAt)}
        </span>
      </td>
      <td className="py-2.5 px-4 text-right">
        <Badge
          className={`text-[10px] border ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
          {log.phase}
        </Badge>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/logs?limit=50");
      if (!res.ok) throw new Error("Failed to load agent logs");
      const data: AgentLog[] = await res.json();
      setLogs(data);
      setLastRefreshed(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-orange-400" />
            Agent Monitor
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Live view of the AI pipeline agents. Auto-refreshes every 10
            seconds.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Auto-refresh indicator */}
      {lastRefreshed && (
        <p className="text-xs text-zinc-600">
          Last updated: {formatTimestamp(lastRefreshed.toISOString())}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Agent status cards */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Pipeline Agents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {AGENT_ORDER.map((agentName) => (
            <AgentStatusCard
              key={agentName}
              agentName={agentName}
              logs={logs}
            />
          ))}
        </div>
      </div>

      {/* Live log feed */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  logs.length > 0
                    ? "bg-orange-400 animate-pulse"
                    : "bg-zinc-700"
                }`}
              />
              Live Log Feed
            </CardTitle>
            <Badge className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700">
              {logs.length} entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded bg-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Activity className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No agent logs yet</p>
              <p className="text-xs text-zinc-700 mt-1">
                Logs appear here once you start generating a reel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider w-32">
                      Agent
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Reel ID
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right w-28">
                      Time
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right w-36">
                      Phase
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
