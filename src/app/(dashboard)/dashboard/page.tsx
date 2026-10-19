import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Film,
  Tv2,
  Layers,
  Zap,
} from "lucide-react";

type ReelStatus =
  | "PENDING"
  | "SCRIPTING"
  | "GENERATING_IMAGES"
  | "ANIMATING"
  | "POST_PRODUCTION"
  | "READY"
  | "FAILED";

const IN_PROGRESS_STATUSES: ReelStatus[] = [
  "PENDING",
  "SCRIPTING",
  "GENERATING_IMAGES",
  "ANIMATING",
  "POST_PRODUCTION",
];

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ReelStatusIcon({ status }: { status: ReelStatus }) {
  if (status === "READY")
    return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  if (status === "FAILED")
    return <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />;
  return (
    <Loader2 className="w-4 h-4 text-amber-400 flex-shrink-0 animate-spin" />
  );
}

function ReelStatusBadge({ status }: { status: ReelStatus }) {
  if (status === "READY")
    return (
      <Badge className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
        Ready
      </Badge>
    );
  if (status === "FAILED")
    return (
      <Badge className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/15">
        Failed
      </Badge>
    );

  const labelMap: Record<ReelStatus, string> = {
    PENDING: "Pending",
    SCRIPTING: "Scripting",
    GENERATING_IMAGES: "Generating",
    ANIMATING: "Animating",
    POST_PRODUCTION: "Post Prod",
    READY: "Ready",
    FAILED: "Failed",
  };

  return (
    <Badge className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
      {labelMap[status]}
    </Badge>
  );
}

const AGENTS = [
  {
    name: "Director",
    model: "gemini-2.5-pro",
    description: "Orchestrates the pipeline",
  },
  {
    name: "Screenwriter",
    model: "gemini-2.5-pro",
    description: "Writes scripts & narration",
  },
  {
    name: "Artist",
    model: "flux-1-dev",
    description: "Generates scene images",
  },
  {
    name: "Animator",
    model: "seedance-2.0",
    description: "Animates still frames",
  },
  {
    name: "Producer",
    model: "ffmpeg",
    description: "Assembles final video",
  },
];

export default async function DashboardPage() {
  const [totalReels, readyReels, inProgressReels, activeChannels, recentReels] =
    await Promise.all([
      db.reel.count(),
      db.reel.count({ where: { status: "READY" } }),
      db.reel.count({
        where: { status: { in: IN_PROGRESS_STATUSES } },
      }),
      db.channel.count({ where: { status: "ACTIVE" } }),
      db.reel.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          prompt: true,
          status: true,
          createdAt: true,
          channel: { select: { name: true } },
        },
      }),
    ]);

  const stats = [
    {
      label: "Total Reels",
      value: totalReels,
      icon: Film,
      sub: totalReels === 1 ? "1 reel created" : `${totalReels} reels created`,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Ready",
      value: readyReels,
      icon: CheckCircle2,
      sub: readyReels === 1 ? "Ready to publish" : "Ready to publish",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "In Progress",
      value: inProgressReels,
      icon: Loader2,
      sub: inProgressReels > 0 ? "Processing now" : "Pipeline idle",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Active Channels",
      value: activeChannels,
      icon: Tv2,
      sub:
        activeChannels === 1
          ? "1 channel active"
          : `${activeChannels} channels active`,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Studio Overview</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Your autonomous video production pipeline
          </p>
        </div>
        <Button
          asChild
          className="bg-orange-600 hover:bg-orange-500 text-white border-0 font-medium"
        >
          <Link href="/generate">
            <Zap className="w-4 h-4 mr-1.5" />
            New Reel
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </CardTitle>
                <div
                  className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white tabular-nums">
                {stat.value}
              </div>
              <p className="text-xs text-zinc-500 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reels */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                Recent Reels
              </div>
              <Badge
                variant="secondary"
                className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700"
              >
                {totalReels} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
                <Film className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No reels yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-zinc-500 hover:text-white"
                  asChild
                >
                  <Link href="/generate">Create your first reel →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentReels.map((reel) => (
                  <div
                    key={reel.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                  >
                    <ReelStatusIcon status={reel.status as ReelStatus} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate leading-tight">
                        {reel.prompt.length > 55
                          ? `${reel.prompt.slice(0, 55)}…`
                          : reel.prompt}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500">
                          {reel.channel.name}
                        </span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600">
                          {timeAgo(reel.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ReelStatusBadge status={reel.status as ReelStatus} />
                  </div>
                ))}
                {totalReels > 5 && (
                  <div className="pt-2 border-t border-zinc-800">
                    <Link
                      href="/library"
                      className="text-xs text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-1"
                    >
                      View all {totalReels} reels →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Pipeline */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex-shrink-0" />
              Agent Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {AGENTS.map((agent, index) => (
                <div key={agent.name}>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">
                            {agent.name}
                          </span>
                          <span className="text-xs text-zinc-600 font-mono">
                            {agent.model}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-700 text-zinc-500 bg-transparent"
                    >
                      {inProgressReels > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          active
                        </span>
                      ) : (
                        "idle"
                      )}
                    </Badge>
                  </div>
                  {index < AGENTS.length - 1 && (
                    <div className="ml-3 border-l border-dashed border-zinc-800 h-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
