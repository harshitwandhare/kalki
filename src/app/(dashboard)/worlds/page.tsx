"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Globe2,
  ChevronDown,
  Map,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string;
  name: string;
  theme: string;
  _count: { worlds: number };
};

type World = {
  id: string;
  name: string;
  description: string | null;
  visualStyle: string | null;
  referenceUrls: string[];
  createdAt: string;
};

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

// ─── World Card ───────────────────────────────────────────────────────────────

function WorldCard({ world }: { world: World }) {
  const [urls, setUrls] = useState<string[]>(world.referenceUrls);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function addImage() {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    setSaving(true);
    const updated = [...urls, trimmed];
    const res = await fetch(`/api/worlds/${world.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceUrls: updated }),
    });
    setSaving(false);
    if (res.ok) {
      setUrls(updated);
      setNewUrl("");
      setAdding(false);
    }
  }

  async function removeImage(url: string) {
    const updated = urls.filter((u) => u !== url);
    const res = await fetch(`/api/worlds/${world.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceUrls: updated }),
    });
    if (res.ok) setUrls(updated);
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-white truncate">
            {world.name}
          </CardTitle>
          <Map className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 flex-1">
        {world.description ? (
          <p className="text-xs text-zinc-400 line-clamp-3">
            {world.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 italic">No description</p>
        )}

        {/* Visual style pill — constrained width to prevent overflow */}
        {world.visualStyle && (
          <Badge
            className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 max-w-full overflow-hidden"
            title={world.visualStyle}
          >
            <span className="truncate block">{world.visualStyle}</span>
          </Badge>
        )}

        {/* Reference images */}
        {urls.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-1">
            {urls.map((url, i) => (
              <div key={i} className="relative group shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Ref ${i + 1}`}
                  className="w-14 h-14 object-cover rounded border border-zinc-700 group-hover:border-zinc-500 transition-colors"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' fill='%2352525b'%3E%3Crect width='56' height='56'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%2371717a'%3E?%3C/text%3E%3C/svg%3E";
                  }}
                />
                {/* Overlay: open + remove */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className="text-white hover:text-orange-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => removeImage(url)}
                    className="text-white hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add image URL */}
        {adding ? (
          <div className="flex gap-1.5 mt-1">
            <input
              type="url"
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addImage()}
              autoFocus
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
            <button
              onClick={addImage}
              disabled={saving}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewUrl("");
              }}
              className="text-xs text-zinc-500 hover:text-white px-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors mt-1 w-fit"
          >
            <Plus className="w-3 h-3" /> Add reference image
          </button>
        )}

        <p className="text-xs text-zinc-600 mt-auto pt-2">
          Created {timeAgo(world.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorldsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState("");

  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [worlds, setWorlds] = useState<World[]>([]);
  const [worldsLoading, setWorldsLoading] = useState(false);
  const [worldsError, setWorldsError] = useState("");

  // Fetch channels
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/channels");
        if (!res.ok) throw new Error("Failed to load channels");
        const data: Channel[] = await res.json();
        setChannels(data);
        if (data.length > 0) setSelectedChannelId(data[0].id);
      } catch (err) {
        setChannelsError(
          err instanceof Error ? err.message : "Failed to load channels",
        );
      } finally {
        setChannelsLoading(false);
      }
    })();
  }, []);

  // Fetch worlds when channel selected
  useEffect(() => {
    if (!selectedChannelId) return;
    (async () => {
      setWorldsLoading(true);
      setWorldsError("");
      try {
        const res = await fetch(`/api/channels/${selectedChannelId}`);
        if (!res.ok) throw new Error("Failed to load channel");
        const data = await res.json();
        setWorlds(data.worlds ?? []);
      } catch (err) {
        setWorldsError(
          err instanceof Error ? err.message : "Failed to load worlds",
        );
      } finally {
        setWorldsLoading(false);
      }
    })();
  }, [selectedChannelId]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Worlds</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Worlds define the visual universe of your channel. Select a channel to
          view its worlds.
        </p>
      </div>

      {/* Channel selector */}
      {channelsLoading ? (
        <div className="h-10 w-64 rounded-lg bg-zinc-800 animate-pulse" />
      ) : channelsError ? (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 w-fit">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {channelsError}
        </div>
      ) : channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Globe2 className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium text-zinc-400">No channels found</p>
          <p className="text-xs text-zinc-600 mt-1">
            Create a channel first to manage worlds.
          </p>
        </div>
      ) : (
        <>
          {/* Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 appearance-none cursor-pointer"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch._count.worlds})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
            {selectedChannel && (
              <span className="text-xs text-zinc-500">
                {selectedChannel._count.worlds} world
                {selectedChannel._count.worlds !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Worlds grid */}
          {worldsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : worldsError ? (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {worldsError}
            </div>
          ) : worlds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-xl">
              <Globe2 className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No worlds in this channel</p>
              <p className="text-xs text-zinc-700 mt-1">
                Worlds are built automatically by the AI pipeline during reel
                generation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {worlds.map((world) => (
                <WorldCard key={world.id} world={world} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
