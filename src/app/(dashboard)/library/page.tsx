"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Copy,
  Check,
  Clock,
  Globe,
  Film,
  AlertTriangle,
  Loader2,
  Library,
} from "lucide-react";
import { buildCaption, PLATFORMS, type PlatformId } from "@/lib/platforms";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReelStatus =
  | "PENDING"
  | "SCRIPTING"
  | "GENERATING_IMAGES"
  | "ANIMATING"
  | "POST_PRODUCTION"
  | "READY"
  | "FAILED";

interface Reel {
  id: string;
  prompt: string;
  title: string | null;
  status: ReelStatus;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  duration: number;
  language: string;
  style: string;
  ytTitle: string | null;
  ytDescription: string | null;
  ytTags: string[];
  channel: { name: string; slug: string; theme: string };
  createdAt: string;
}

type FilterTab = "ALL" | "READY" | "IN_PROGRESS" | "FAILED";

// ─── Constants ────────────────────────────────────────────────────────────────

const IN_PROGRESS_STATUSES: ReelStatus[] = [
  "PENDING",
  "SCRIPTING",
  "GENERATING_IMAGES",
  "ANIMATING",
  "POST_PRODUCTION",
];

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "READY", label: "Ready" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "FAILED", label: "Failed" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: ReelStatus) {
  if (status === "READY")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Ready
      </span>
    );
  if (status === "FAILED")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
        <AlertTriangle className="w-3 h-3" />
        Failed
      </span>
    );
  const labelMap: Record<ReelStatus, string> = {
    PENDING: "Pending",
    SCRIPTING: "Scripting",
    GENERATING_IMAGES: "Generating",
    ANIMATING: "Animating",
    POST_PRODUCTION: "Post Production",
    READY: "Ready",
    FAILED: "Failed",
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
      <Loader2 className="w-3 h-3 animate-spin" />
      {labelMap[status]}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function filterReels(reels: Reel[], tab: FilterTab): Reel[] {
  if (tab === "ALL") return reels;
  if (tab === "READY") return reels.filter((r) => r.status === "READY");
  if (tab === "FAILED") return reels.filter((r) => r.status === "FAILED");
  return reels.filter((r) => IN_PROGRESS_STATUSES.includes(r.status));
}

function countForTab(reels: Reel[], tab: FilterTab): number {
  return filterReels(reels, tab).length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReelCardSkeleton() {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <Skeleton className="w-full aspect-video bg-zinc-800" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-3/4 bg-zinc-800" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-20 bg-zinc-800" />
          <Skeleton className="h-6 w-16 bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

function PublishPanel({ reel }: { reel: Reel }) {
  const [platformId, setPlatformId] = useState<PlatformId>("youtube");
  const [copied, setCopied] = useState(false);
  const platform = PLATFORMS.find((p) => p.id === platformId)!;
  const caption = buildCaption(platform, {
    title: reel.ytTitle ?? reel.title,
    description: reel.ytDescription,
    tags: reel.ytTags,
  });

  const handleCopy = async () => {
    const text = caption.title
      ? `${caption.title}

${caption.caption}`
      : caption.caption;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the caption is still shown below to select by hand.
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Publish to"
          value={platformId}
          onChange={(e) => setPlatformId(e.target.value as PlatformId)}
          className="text-xs px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700"
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700 hover:border-zinc-600"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy caption
            </>
          )}
        </button>
        {reel.videoUrl && (
          <a
            href={reel.videoUrl}
            download
            className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
          >
            Download MP4
          </a>
        )}
        <a
          href={platform.uploadUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white"
        >
          Open {platform.name}
        </a>
      </div>
      <p className="text-[11px] text-zinc-500">{platform.disclosure}</p>
    </div>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  return (
    <div className="group rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/40 flex flex-col">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden flex-shrink-0">
        {reel.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reel.thumbnailUrl}
            alt={reel.title ?? reel.prompt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Play className="w-5 h-5 text-white/60 ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">{statusBadge(reel.status)}</div>
        <div className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded bg-black/70 text-zinc-300 font-mono backdrop-blur-sm">
          {reel.duration}s
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
            {reel.title ?? reel.prompt}
          </p>
          {reel.title && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
              {reel.prompt}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
            <Film className="w-3 h-3" />
            {reel.channel.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Globe className="w-3 h-3" />
            {reel.language.charAt(0) + reel.language.slice(1).toLowerCase()}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
            {reel.style.replace(/_/g, " ").charAt(0).toUpperCase() +
              reel.style.replace(/_/g, " ").slice(1).toLowerCase()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            {timeAgo(reel.createdAt)}
          </div>
          {reel.status === "READY" && <PublishPanel reel={reel} />}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, { title: string; sub: string }> = {
    ALL: {
      title: "No reels yet",
      sub: "Generate your first reel to see it here.",
    },
    READY: {
      title: "No ready reels",
      sub: "Reels will appear here once they finish processing.",
    },
    IN_PROGRESS: {
      title: "No reels in progress",
      sub: "Start generating a reel to see its progress here.",
    },
    FAILED: { title: "No failed reels", sub: "All your reels are healthy." },
  };
  const { title, sub } = messages[filter];
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Library className="w-7 h-7 text-zinc-600" />
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="text-xs text-zinc-600 mt-1 max-w-xs">{sub}</p>
      <Button
        asChild
        size="sm"
        className="mt-6 bg-orange-600 hover:bg-orange-500 text-white border-0"
      >
        <Link href="/generate">+ New Reel</Link>
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LibraryDashboardPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/reels");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        setReels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filterReels(reels, activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Library className="w-6 h-6 text-zinc-400" />
            Reel Library
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {loading
              ? "Loading…"
              : `${reels.length} reel${reels.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Button
          asChild
          className="bg-orange-600 hover:bg-orange-500 text-white border-0 font-medium"
        >
          <Link href="/generate">+ New Reel</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => {
          const count = loading ? null : countForTab(reels, tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
              {count !== null && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-mono leading-none ${
                    isActive
                      ? "bg-black/10 text-black"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReelCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={activeTab} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      )}
    </div>
  );
}
