"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Film,
  Users,
  Globe2,
  Settings,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Map,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReelStatus =
  | "PENDING"
  | "SCRIPTING"
  | "GENERATING_IMAGES"
  | "ANIMATING"
  | "POST_PRODUCTION"
  | "READY"
  | "FAILED";

type Reel = {
  id: string;
  prompt: string;
  title: string | null;
  status: ReelStatus;
  language: string;
  duration: number;
  createdAt: string;
};

type Character = {
  id: string;
  name: string;
  soulDocument: unknown;
  referenceUrls: string[];
  createdAt: string;
};

type World = {
  id: string;
  name: string;
  description: string | null;
  visualStyle: string | null;
  referenceUrls: string[];
  createdAt: string;
};

type Channel = {
  id: string;
  name: string;
  slug: string;
  theme: string;
  language: string;
  status: string;
  description: string | null;
  reels: Reel[];
  characters: Character[];
  worlds: World[];
  _count: { reels: number; characters: number; worlds: number };
};

type Tab = "reels" | "characters" | "worlds" | "settings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTheme(theme: string): string {
  return theme.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const THEME_BADGE_COLORS: Record<string, string> = {
  INDIAN_GEN_Z: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  US_PARENTS: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  MOTIVATION_KARMA: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  FANTASY_ADVENTURE: "bg-green-500/15 text-green-400 border-green-500/30",
};

function getThemeBadgeClass(theme: string): string {
  return (
    THEME_BADGE_COLORS[theme] ??
    "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  );
}

// ─── Reel Status ──────────────────────────────────────────────────────────────

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
  const labels: Record<ReelStatus, string> = {
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
      {labels[status]}
    </Badge>
  );
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

// ─── Soul Document Modal ──────────────────────────────────────────────────────

function SoulDocModal({
  character,
  onClose,
}: {
  character: Character;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {character.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Soul Document</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-sm px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
        <div className="overflow-auto flex-1 p-4">
          <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(character.soulDocument, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Form ────────────────────────────────────────────────────────────

function SettingsTab({
  channel,
  onUpdated,
}: {
  channel: Channel;
  onUpdated: (c: Channel) => void;
}) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [status, setStatus] = useState(channel.status);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Update failed");
      }
      const updated = await res.json();
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 appearance-none";

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Channel Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
          className="bg-zinc-800/60 border-zinc-700 text-white focus-visible:ring-orange-500/40"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={saving}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 disabled:opacity-50 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={saving}
          className={selectClass}
        >
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      <Button
        type="submit"
        disabled={saving}
        className="bg-orange-600 hover:bg-orange-500 text-white border-0 font-semibold"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving…
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Saved!
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("reels");
  const [soulDocChar, setSoulDocChar] = useState<Character | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/channels/${id}`);
        if (!res.ok) throw new Error("Channel not found");
        const data: Channel = await res.json();
        setChannel(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load channel");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error || "Channel not found"}
        </div>
        <Button
          asChild
          variant="ghost"
          className="mt-4 text-zinc-400 hover:text-white"
        >
          <Link href="/channels">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Channels
          </Link>
        </Button>
      </div>
    );
  }

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ElementType;
    count: number;
  }[] = [
    { id: "reels", label: "Reels", icon: Film, count: channel._count.reels },
    {
      id: "characters",
      label: "Characters",
      icon: Users,
      count: channel._count.characters,
    },
    {
      id: "worlds",
      label: "Worlds",
      icon: Globe2,
      count: channel._count.worlds,
    },
    { id: "settings", label: "Settings", icon: Settings, count: 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/channels"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All Channels
      </Link>

      {/* Channel header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{channel.name}</h1>
            <Badge
              className={`text-xs border ${getThemeBadgeClass(channel.theme)}`}
            >
              {formatTheme(channel.theme)}
            </Badge>
            <Badge
              className={`text-xs ${
                channel.status === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/40"
              }`}
            >
              {channel.status === "ACTIVE" ? "Active" : "Paused"}
            </Badge>
          </div>
          {channel.description && (
            <p className="text-sm text-zinc-400 mt-1">{channel.description}</p>
          )}
          <p className="text-xs text-zinc-600 font-mono mt-1">
            /{channel.slug}
          </p>
        </div>
        <Button
          asChild
          className="bg-orange-600 hover:bg-orange-500 text-white border-0 font-medium flex-shrink-0"
        >
          <Link href="/generate">
            <Film className="w-4 h-4 mr-1.5" />
            New Reel
          </Link>
        </Button>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-mono leading-none ${
                    isActive
                      ? "bg-black/10 text-black"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "reels" && (
        <div className="space-y-2">
          {channel.reels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
              <Film className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No reels yet</p>
              <p className="text-xs text-zinc-700 mt-1">
                Generate your first reel for this channel.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 bg-orange-600 hover:bg-orange-500 text-white border-0"
              >
                <Link href="/generate">Generate Reel</Link>
              </Button>
            </div>
          ) : (
            channel.reels.map((reel) => (
              <div
                key={reel.id}
                className="flex items-center gap-3 py-3 px-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <ReelStatusIcon status={reel.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {reel.title ?? reel.prompt}
                  </p>
                  {reel.title && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {reel.prompt}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ReelStatusBadge status={reel.status} />
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {timeAgo(reel.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
          {channel._count.reels > channel.reels.length && (
            <p className="text-xs text-zinc-600 text-center pt-2">
              Showing {channel.reels.length} of {channel._count.reels} reels.{" "}
              <Link
                href="/library"
                className="text-orange-400 hover:text-orange-300"
              >
                View all in Library
              </Link>
            </p>
          )}
        </div>
      )}

      {activeTab === "characters" && (
        <div>
          {channel.characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No characters yet</p>
              <p className="text-xs text-zinc-700 mt-1">
                Characters are created by the AI pipeline during reel
                generation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {channel.characters.map((char) => (
                <Card
                  key={char.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold text-white">
                        {char.name}
                      </CardTitle>
                      <Badge className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Soul Doc
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-zinc-500">
                      Created {timeAgo(char.createdAt)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSoulDocChar(char)}
                      className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                      View Soul Document
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "worlds" && (
        <div>
          {channel.worlds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
              <Globe2 className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No worlds yet</p>
              <p className="text-xs text-zinc-700 mt-1">
                Worlds are defined during reel generation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {channel.worlds.map((world) => (
                <Card
                  key={world.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold text-white">
                        {world.name}
                      </CardTitle>
                      <Map className="w-4 h-4 text-zinc-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {world.description && (
                      <p className="text-xs text-zinc-400 line-clamp-3">
                        {world.description}
                      </p>
                    )}
                    {world.visualStyle && (
                      <Badge className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {world.visualStyle}
                      </Badge>
                    )}
                    <p className="text-xs text-zinc-600">
                      Created {timeAgo(world.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <SettingsTab
          channel={channel}
          onUpdated={(updated) =>
            setChannel((prev) =>
              prev
                ? {
                    ...prev,
                    name: updated.name,
                    description: updated.description,
                    status: updated.status,
                  }
                : prev,
            )
          }
        />
      )}

      {/* Soul doc modal */}
      {soulDocChar && (
        <SoulDocModal
          character={soulDocChar}
          onClose={() => setSoulDocChar(null)}
        />
      )}
    </div>
  );
}
