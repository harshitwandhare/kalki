"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Key,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sliders,
  Youtube,
  Loader2,
  AlertTriangle,
  FolderOpen,
  Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiKeyEntry = {
  label: string;
  envKey: string;
  configured: boolean;
  note?: string;
};

type PipelineDefault = {
  label: string;
  value: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const API_KEYS: Omit<ApiKeyEntry, "configured">[] = [
  { label: "Google Gemini (required)", envKey: "GOOGLE_GENERATIVE_AI_API_KEY" },
  { label: "Stability AI", envKey: "STABILITY_API_KEY" },
  { label: "ElevenLabs", envKey: "ELEVENLABS_API_KEY" },
  { label: "Seedance", envKey: "SEEDANCE_API_KEY" },
  { label: "Kling", envKey: "KLING_API_KEY" },
  { label: "WhatsApp webhook secret", envKey: "KALKI_WEBHOOK_SECRET" },
];

const PIPELINE_DEFAULTS: PipelineDefault[] = [
  { label: "Default Quality", value: "HD 1080p" },
  { label: "Default Duration", value: "60 seconds" },
  { label: "Default Language", value: "English" },
  { label: "Default Style", value: "Cinematic" },
];

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── WhatsApp Test ────────────────────────────────────────────────────────────

function WhatsAppTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/whatsapp");
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({
          ok: true,
          message:
            (body as { message?: string }).message ?? "Connected successfully",
        });
      } else {
        setResult({
          ok: false,
          message: (body as { error?: string }).error ?? "Connection failed",
        });
      }
    } catch {
      setResult({ ok: false, message: "Request failed — check gateway" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Status
          </p>
          <p className="text-sm text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Connected
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Number
          </p>
          <p className="text-sm text-white font-mono">
            Set via WHATSAPP_OWNER_NUMBER
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Gateway
          </p>
          <p className="text-sm text-zinc-300 font-mono">
            http://127.0.0.1:18789
          </p>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="space-y-2">
        <Button
          onClick={handleTest}
          disabled={testing}
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          {testing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Testing…
            </>
          ) : (
            "Test Connection"
          )}
        </Button>

        {result && (
          <div
            className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 ${
              result.ok
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePassword() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (form.next !== form.confirm) {
      setStatus({ ok: false, message: "New passwords do not match." });
      return;
    }
    if (form.next.length < 8) {
      setStatus({
        ok: false,
        message: "New password must be at least 8 characters.",
      });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.current,
        newPassword: form.next,
      }),
    });
    const data = await res.json();
    setLoading(false);
    setStatus({
      ok: res.ok,
      message: data.message ?? data.error ?? "Unknown error",
    });
    if (res.ok) setForm({ current: "", next: "", confirm: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="password"
        placeholder="Current password"
        value={form.current}
        onChange={(e) => set("current", e.target.value)}
        required
        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
      />
      <Input
        type="password"
        placeholder="New password (min. 8 characters)"
        value={form.next}
        onChange={(e) => set("next", e.target.value)}
        required
        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={form.confirm}
        onChange={(e) => set("confirm", e.target.value)}
        required
        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
      />
      {status && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 ${
            status.ok
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {status.ok ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          {status.message}
        </div>
      )}
      <Button
        type="submit"
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  useEffect(() => {
    fetch("/api/settings/providers")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setKeyStatus)
      .catch(() => setKeyStatus({}));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-zinc-400" />
          Settings
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Configuration overview for Kalki Studio.
        </p>
      </div>

      {/* API Keys */}
      <Section icon={Key} title="API Keys">
        <div className="space-y-3">
          {API_KEYS.map((base) => ({
            ...base,
            configured: !!keyStatus[base.envKey],
            note: "Set in .env.local",
          })).map((entry) => (
            <div
              key={entry.envKey}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200">{entry.label}</p>
                <p className="text-xs font-mono text-zinc-600 mt-0.5">
                  {entry.envKey}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {entry.configured ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    {entry.note ?? "Not set"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            Keys are read from{" "}
            <code className="text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded">
              .env.local
            </code>{" "}
            at build time. Update and restart the server to apply changes.
          </p>
        </div>
      </Section>

      {/* WhatsApp Integration */}
      <Section icon={MessageSquare} title="WhatsApp Integration">
        <WhatsAppTest />
      </Section>

      {/* Pipeline Defaults */}
      <Section icon={Sliders} title="Pipeline Defaults">
        <div className="grid grid-cols-2 gap-4">
          {PIPELINE_DEFAULTS.map((item) => (
            <div
              key={item.label}
              className="bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-800"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className="text-sm font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-4">
          Override these per-reel in the Generate page.
        </p>
      </Section>

      {/* Security */}
      <Section icon={Lock} title="Security — Change Password">
        <ChangePassword />
      </Section>

      {/* YouTube Publishing */}
      <Section icon={Youtube} title="YouTube Publishing">
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-zinc-800/40 rounded-lg px-4 py-3 border border-zinc-800">
            <FolderOpen className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-200 font-medium">
                Output Directory
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                public/videos/
              </p>
              <p className="text-xs text-zinc-600 mt-1.5">
                Completed reel files are saved here. Upload manually to YouTube
                via YouTube Studio.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-zinc-800/40 rounded-lg px-4 py-3 border border-zinc-800">
            <Youtube className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-200 font-medium">
                YouTube Studio
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Auto-publish via YouTube API is not yet enabled. Use the Library
                page to copy video metadata (title, description, tags) then
                upload manually.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
