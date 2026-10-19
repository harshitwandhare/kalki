"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tv2,
  Plus,
  Film,
  Users,
  Globe,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string;
  name: string;
  slug: string;
  theme: string;
  language: string;
  status: string;
  description: string | null;
  _count: {
    reels: number;
    characters: number;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
  "INDIAN_GEN_Z",
  "US_PARENTS",
  "MOTIVATION_KARMA",
  "FANTASY_ADVENTURE",
  "COMEDY_MEMES",
  "EDUCATIONAL",
  "HORROR_MYSTERY",
  "ROMANCE",
  "TRUE_CRIME",
  "FITNESS_HEALTH",
  "TRAVEL",
  "COOKING",
];

const LANGUAGE_OPTIONS = ["ENGLISH", "HINDI", "HINGLISH", "MARATHI"];

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

function formatTheme(theme: string): string {
  return theme.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLanguage(lang: string): string {
  return lang.charAt(0) + lang.slice(1).toLowerCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelCard({ channel }: { channel: Channel }) {
  const isActive = channel.status === "ACTIVE";
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-white truncate">
              {channel.name}
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              /{channel.slug}
            </p>
          </div>
          <Badge
            className={`text-xs flex-shrink-0 ${
              isActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/40"
            }`}
          >
            {isActive ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            className={`text-xs border ${getThemeBadgeClass(channel.theme)}`}
          >
            {formatTheme(channel.theme)}
          </Badge>
          <Badge className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Globe className="w-3 h-3 mr-1" />
            {formatLanguage(channel.language)}
          </Badge>
        </div>

        {/* Description */}
        {channel.description && (
          <p className="text-xs text-zinc-500 line-clamp-2">
            {channel.description}
          </p>
        )}

        {/* Counts */}
        <div className="flex items-center gap-4 mt-auto pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Film className="w-3.5 h-3.5" />
            <span>{channel._count.reels} reels</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span>{channel._count.characters} characters</span>
          </div>
        </div>

        {/* Action */}
        <Button
          asChild
          size="sm"
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600 font-medium"
        >
          <Link href={`/channels/${channel.id}`}>Manage</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Tv2 className="w-7 h-7 text-zinc-600" />
      </div>
      <p className="text-sm font-medium text-zinc-300">No channels yet</p>
      <p className="text-xs text-zinc-600 mt-1 max-w-xs">
        Channels define your content theme, language and character universe.
      </p>
      <Button
        onClick={onNew}
        className="mt-6 bg-orange-600 hover:bg-orange-500 text-white border-0 font-medium"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Create your first channel
      </Button>
    </div>
  );
}

// ─── New Channel Dialog Form ──────────────────────────────────────────────────

type NewChannelForm = {
  name: string;
  theme: string;
  language: string;
  description: string;
};

function NewChannelDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<NewChannelForm>({
    name: "",
    theme: "INDIAN_GEN_Z",
    language: "ENGLISH",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateForm(field: keyof NewChannelForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Channel name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          theme: form.theme,
          language: form.language,
          description: form.description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to create channel",
        );
      }
      setForm({
        name: "",
        theme: "INDIAN_GEN_Z",
        language: "ENGLISH",
        description: "",
      });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 appearance-none cursor-pointer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">New Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Channel Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="e.g. Kalki Stories"
              disabled={submitting}
              className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500/40 focus-visible:border-orange-500/50"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Theme
            </label>
            <select
              value={form.theme}
              onChange={(e) => updateForm("theme", e.target.value)}
              disabled={submitting}
              className={selectClass}
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTheme(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Language
            </label>
            <select
              value={form.language}
              onChange={(e) => updateForm("language", e.target.value)}
              disabled={submitting}
              className={selectClass}
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {formatLanguage(l)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="What kind of content does this channel produce?"
              rows={3}
              disabled={submitting}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white border-0 font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Channel"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchChannels() {
    try {
      setLoading(true);
      const res = await fetch("/api/channels");
      if (!res.ok) throw new Error("Failed to load channels");
      const data: Channel[] = await res.json();
      setChannels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChannels();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Channels</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your content channels and their universes.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white border-0 font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Channel
        </Button>
      </div>

      {/* Dialog */}
      <NewChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchChannels}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-900 border border-zinc-800 h-56 animate-pulse"
            />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <EmptyState onNew={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <ChannelCard key={ch.id} channel={ch} />
          ))}
        </div>
      )}
    </div>
  );
}
