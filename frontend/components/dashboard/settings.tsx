"use client";

import { useEffect, useState, useCallback, type FormEvent, type ComponentType } from "react";
import {
  Building2,
  Plug,
  Users,
  CreditCard,
  ChartColumn,
  Plus,
  Trash2,
  Check,
  Copy,
  MessageCircle,
  Instagram,
  MessageSquare,
  Globe,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { webstackpro } from "@/lib/api";
import { naira } from "@/lib/utils";
import { WebStackProBusiness, ChannelRecord, WebStackProAgent } from "@/lib/types";

const CHANNEL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  messenger: MessageSquare,
  web: Globe,
};

type Analytics = {
  days: number;
  conversations: number;
  messages: number;
  aiReplies: number;
  humanReplies: number;
  aiAutoResolveRate: number;
  connectedChannels: string[];
  avgResponseMinutes: number;
};

type BillingStatus = {
  plan: string;
  planActive: boolean;
  trialEnds: string | null;
  paystackPublicKey: string | null;
  plans: Record<string, { naira: number; label: string }>;
};

/**
 * WebStackPro Settings — Business Info, Channels, Team, Billing, Analytics.
 */
export function WebStackProSettings() {
  const [business, setBusiness] = useState<WebStackProBusiness | null>(null);
  const [channels, setChannels] = useState<ChannelRecord[]>([]);
  const [embedScript, setEmbedScript] = useState("");
  const [agents, setAgents] = useState<WebStackProAgent[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // form states
  const [bizName, setBizName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [plans, setPlans] = useState<Record<string, { naira: number; label: string }>>({});
  const [channelDraft, setChannelDraft] = useState<Record<string, Record<string, string>>>({});

  function setChannelField(type: string, field: string, value: string) {
    setChannelDraft((d) => ({
      ...d,
      [type]: { ...(d[type] || {}), [field]: value },
    }));
  }

  function toastify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 3000);
  }

  const loadAll = useCallback(async () => {
    const cached = localStorage.getItem("webstackpro_business");
    if (cached) {
      try {
        const b = JSON.parse(cached) as WebStackProBusiness;
        setBusiness(b);
        setBizName(b.name);
      } catch (_) {
        /* ignore */
      }
    }

    try {
      const [ch, team, bill, an] = await Promise.all([
        webstackpro.get<{ channels: ChannelRecord[]; embedScript: string }>("/settings/channels"),
        webstackpro.get<{ agents: WebStackProAgent[] }>("/settings/team"),
        webstackpro.get<BillingStatus>("/billing/status"),
        webstackpro.get<Analytics>("/settings/analytics"),
      ]);
      setChannels(ch.channels);
      setEmbedScript(ch.embedScript);
      setAgents(team.agents);
      setBilling(bill);
      setAnalytics(an);
      setPlans(bill.plans || {});
    } catch (_) {
      // Some endpoints may be unavailable without the backend; dashboard still renders.
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#billing") {
        document.getElementById("billing")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("hashchange", onHash);
    if (window.location.hash === "#billing") onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  async function saveBusiness(e: FormEvent) {
    e.preventDefault();
    try {
      await webstackpro.patch("/settings/business", { name: bizName });
      setBusiness((b) => (b ? { ...b, name: bizName } : b));
      localStorage.setItem("webstackpro_business", JSON.stringify({ ...business, name: bizName }));
      toastify("WebStackPro business updated.");
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro update failed");
    }
  }

  async function connectChannel(type: string) {
    setConnecting(type);
    try {
      await webstackpro.post("/settings/channels/connect", {
        type,
        config: type === "web" ? {} : channelDraft[type] || {},
      });
      toastify(`${type} connected to WebStackPro`);
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro connect failed");
    } finally {
      setConnecting(null);
    }
  }

  async function disconnectChannel(type: string) {
    try {
      await webstackpro.post("/settings/channels/disconnect", { type });
      toastify(`${type} disconnected from WebStackPro`);
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro disconnect failed");
    }
  }

  async function addAgent(e: FormEvent) {
    e.preventDefault();
    if (!agentName.trim() || !agentEmail.trim()) return;
    try {
      await webstackpro.post("/settings/team", { name: agentName, email: agentEmail, role: "agent" });
      setAgentName("");
      setAgentEmail("");
      toastify("WebStackPro agent added.");
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro agent failed");
    }
  }

  async function removeAgent(id: string) {
    try {
      await webstackpro.del(`/settings/team/${id}`);
      toastify("WebStackPro agent removed.");
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro remove failed");
    }
  }

  async function subscribe(plan: string) {
    try {
      const res = await webstackpro.post<{ authorization_url: string }>("/billing/subscribe", { plan });
      window.location.href = res.authorization_url;
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro subscribe failed");
    }
  }

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embedScript);
      toastify("WebStackPro widget code copied!");
    } catch (_) {
      toastify("Could not copy — select the code manually.");
    }
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toastify(`${label} copied!`);
    } catch (_) {
      toastify("Could not copy — select the text manually.");
    }
  }

  // Which credentials each Meta channel needs, with help text.
  const CHANNEL_FIELDS: Record<string, { name: string; label: string; placeholder: string; help: string }[]> = {
    whatsapp: [
      { name: "accessToken", label: "Access Token", placeholder: "EAAAA...", help: "WhatsApp Cloud API token from Meta App Dashboard" },
      { name: "phoneNumberId", label: "Phone Number ID", placeholder: "123456789012345", help: "Find under WhatsApp > API Setup in your Meta app" },
      { name: "verifyToken", label: "Verify Token (optional)", placeholder: "your_secret", help: "Only if you use a per-business token; defaults to .env" },
    ],
    instagram: [
      { name: "accessToken", label: "Access Token", placeholder: "IGAA...", help: "Instagram user access token from Meta Graph API" },
      { name: "igUserId", label: "Instagram User / Page ID", placeholder: "178414...", help: "The IG professional account ID connected to your app" },
    ],
    messenger: [
      { name: "accessToken", label: "Page Access Token", placeholder: "EAA...", help: "Messenger page token from your Meta app" },
      { name: "pageId", label: "Page ID", placeholder: "1029384756", help: "The Facebook Page ID the Messenger app is linked to" },
    ],
    web: [],
  };

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy">WebStackPro Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your WebStackPro business, channels, team, billing and analytics.
            </p>
          </div>
          {billing && (
            <Badge variant={billing.planActive ? "ai" : "muted"}>
              {billing.plan.toUpperCase()}
              {billing.plan === "trial" && " · TRIAL"}
            </Badge>
          )}
        </div>

        {flash && (
          <div className="rounded-lg border border-cyan/40 bg-cyan/10 p-3 text-sm text-navy">{flash}</div>
        )}

        {/* ============ BUSINESS INFO ============ */}
        <Card id="business" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Building2 className="h-5 w-5 text-cyan-dark" /> WebStackPro Business Info
            </CardTitle>
            <CardDescription>This name is used by WebStackPro AI when greeting customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveBusiness} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="My WebStackPro Business"
                className="flex-1"
              />
              <Button type="submit" variant="navy">
                <Check className="h-4 w-4" /> Save Business Info
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ============ CHANNELS ============ */}
        <Card id="channels" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Plug className="h-5 w-5 text-cyan-dark" /> Connect Channels to WebStackPro
            </CardTitle>
            <CardDescription>
              Add your real channel credentials. Every connected channel funnels into your WebStackPro Unified Inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((ch) => {
              const Icon = CHANNEL_ICONS[ch.type] || Globe;
              const fields = CHANNEL_FIELDS[ch.type] || [];
              const draft = channelDraft[ch.type] || {};
              const webhookUrl = ch.webhookUrl;
              return (
                <div key={ch.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan/15 text-cyan-dark">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-navy">{ch.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {ch.connected ? (
                          <>
                            Connected to WebStackPro
                            {ch.configMasked && Object.keys(ch.configMasked).length > 0 && (
                              <span className="ml-1 font-mono text-[11px]">
                                ({Object.entries(ch.configMasked).map(([k, v]) => `${k}: ${v}`).join(" · ")})
                              </span>
                            )}
                          </>
                        ) : "Not connected yet"}
                      </p>
                    </div>
                    {ch.connected && (
                      <Button variant="outline" size="sm" onClick={() => disconnectChannel(ch.type)}>
                        Disconnect
                      </Button>
                    )}
                  </div>

                  {webhookUrl && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-navy p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wide text-white/60">Webhook URL (paste in Meta)</p>
                        <code className="block truncate text-xs text-cyan">{webhookUrl}</code>
                      </div>
                      <Button size="sm" variant="cyan" onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                    </div>
                  )}

                  {(fields.length > 0 || !ch.connected) && (
                    <div className="mt-3 grid gap-3">
                      {fields.map((f) => (
                        <div key={f.name}>
                          <div className="flex items-baseline justify-between">
                            <label className="mb-1 block text-xs font-semibold text-navy">{f.label}</label>
                            <span className="text-[11px] text-muted-foreground">{f.help}</span>
                          </div>
                          <Input
                            type={f.name === "accessToken" || f.name === "verifyToken" ? "password" : "text"}
                            value={draft[f.name] || ""}
                            onChange={(e) => setChannelField(ch.type, f.name, e.target.value)}
                            placeholder={ch.connected && !draft[f.name] ? "(token hidden — leave blank to keep)" : f.placeholder}
                            className="mt-1"
                          />
                        </div>
                      ))}
                      {ch.type !== "web" && (
                        <Button variant="cyan" size="sm" disabled={connecting === ch.type} onClick={() => connectChannel(ch.type)}>
                          {connecting === ch.type ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                          {ch.connected ? "Update WebStackPro credentials" : "Save & connect WebStackPro"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {embedScript && (
              <div className="rounded-xl border border-dashed border-cyan/50 bg-cyan/5 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy">
                  <Globe className="h-4 w-4 text-cyan-dark" /> WebStackPro Website Widget
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Add this script to your site to connect website chat to WebStackPro:
                </p>
                <code className="block whitespace-pre-wrap break-all rounded-lg bg-navy p-3 text-xs text-cyan">
                  {embedScript}
                </code>
                <Button size="sm" variant="navy" className="mt-3" onClick={copyEmbed}>
                  <Copy className="h-3.5 w-3.5" /> Copy WebStackPro embed code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============ TEAM ============ */}
        <Card id="team" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Users className="h-5 w-5 text-cyan-dark" /> WebStackPro Team Management
            </CardTitle>
            <CardDescription>Human agents that take over from WebStackPro AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addAgent} className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent name"
                className="flex-1"
              />
              <Input
                value={agentEmail}
                onChange={(e) => setAgentEmail(e.target.value)}
                placeholder="agent@business.ng"
                type="email"
                className="flex-1"
              />
              <Button type="submit" variant="navy">
                <Plus className="h-4 w-4" /> Add Agent
              </Button>
            </form>

            <div className="space-y-2">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                    {a.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy">
                      {a.name}{" "}
                      {a.role === "admin" && (
                        <Badge variant="cyan" className="ml-1 text-[9px]">ADMIN</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  {a.role !== "admin" && (
                    <button
                      onClick={() => removeAgent(a.id)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {agents.length === 0 && (
                <p className="text-sm text-muted-foreground">No WebStackPro agents yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============ BILLING ============ */}
        <Card id="billing" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <CreditCard className="h-5 w-5 text-cyan-dark" /> WebStackPro Billing
            </CardTitle>
            <CardDescription>
              Billed securely via Paystack. Subscribe to WebStackPro to keep your AI agent on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billing && (
              <div className="mb-4 rounded-xl bg-navy p-4 text-white">
                <p className="text-sm">
                  Current plan: <span className="font-bold text-cyan">{billing.plan.toUpperCase()}</span>
                </p>
                {billing.plan === "trial" && billing.trialEnds && (
                  <p className="mt-1 text-xs text-white/70">
                    Free trial ends {new Date(billing.trialEnds).toLocaleDateString("en-NG")}. Upgrade to keep WebStackPro active.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(plans).map(([key, p]) => (
                <div key={key} className="rounded-xl border border-border p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-bold text-navy">{p.label}</p>
                      <p className="font-display text-2xl font-extrabold text-navy">
                        {naira(p.naira)}
                        <span className="text-xs font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="cyan"
                    className="mt-4 w-full"
                    onClick={() => subscribe(key)}
                    disabled={billing?.plan === key && billing.planActive}
                  >
                    <CreditCard className="h-4 w-4" />
                    {billing?.plan === key && billing.planActive
                      ? "Active WebStackPro Plan"
                      : "Subscribe to WebStackPro"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ============ ANALYTICS ============ */}
        <Card id="analytics" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <ChartColumn className="h-5 w-5 text-cyan-dark" /> WebStackPro Analytics
            </CardTitle>
            <CardDescription>Last 7 days across every connected channel.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "Conversations", value: analytics.conversations },
                  { label: "Messages", value: analytics.messages },
                  { label: "AI replies", value: analytics.aiReplies },
                  { label: "AI Auto-resolve", value: `${analytics.aiAutoResolveRate}%` },
                  { label: "Avg response", value: `${analytics.avgResponseMinutes} min` },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-muted/50 p-4">
                    <p className="font-display text-2xl font-extrabold text-navy">{m.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Analytics only available when the WebStackPro API is running.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}