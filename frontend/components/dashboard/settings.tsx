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
  Palette,
  MessageSquareQuote,
  FlaskConical,
  Tag as TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { webstackpro } from "@/lib/api";
import { naira } from "@/lib/utils";
import {
  WebStackProBusiness,
  ChannelRecord,
  WebStackProAgent,
  WidgetConfig,
  CannedReply,
  WebStackProTag,
} from "@/lib/types";

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

  // widget config
  const [widget, setWidget] = useState<WidgetConfig | null>(null);
  const [widgetName, setWidgetName] = useState("");
  const [widgetGreeting, setWidgetGreeting] = useState("");
  const [widgetPrimary, setWidgetPrimary] = useState("#0A1F44");
  const [widgetAccent, setWidgetAccent] = useState("#00D4FF");
  const [widgetShowPowered, setWidgetShowPowered] = useState(true);
  const [widgetCollectLead, setWidgetCollectLead] = useState(true);
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [hoursDays, setHoursDays] = useState("Mon, Tue, Wed, Thu, Fri");
  const [hoursOpen, setHoursOpen] = useState("09:00");
  const [hoursClose, setHoursClose] = useState("17:00");
  const [hoursTimezone, setHoursTimezone] = useState("Africa/Lagos");
  const [hoursAway, setHoursAway] = useState("");

  // canned responses
  const [canned, setCanned] = useState<CannedReply[]>([]);
  const [cannedTitle, setCannedTitle] = useState("");
  const [cannedBody, setCannedBody] = useState("");

  // tags
  const [tags, setTags] = useState<WebStackProTag[]>([]);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#00D4FF");

  // test simulator
  const [testText, setTestText] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState("");

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
      const [ch, team, bill, an, wg, cn, tg] = await Promise.all([
        webstackpro.get<{ channels: ChannelRecord[]; embedScript: string }>("/settings/channels"),
        webstackpro.get<{ agents: WebStackProAgent[] }>("/settings/team"),
        webstackpro.get<BillingStatus>("/billing/status"),
        webstackpro.get<Analytics>("/settings/analytics"),
        webstackpro.get<{ config: WidgetConfig }>("/settings/widget"),
        webstackpro.get<{ canned: CannedReply[] }>("/settings/canned"),
        webstackpro.get<{ tags: WebStackProTag[] }>("/settings/tags"),
      ]);
      setChannels(ch.channels);
      setEmbedScript(ch.embedScript);
      setAgents(team.agents);
      setBilling(bill);
      setAnalytics(an);
      setPlans(bill.plans || {});
      const w = wg.config;
      setWidget(w);
      setWidgetName(w.name);
      setWidgetGreeting(w.greeting);
      setWidgetPrimary(w.primaryColor);
      setWidgetAccent(w.accentColor);
      setWidgetShowPowered(w.showPoweredBy);
      setWidgetCollectLead(w.collectLead);
      setHoursEnabled(w.businessHours.enabled);
      setHoursDays(w.businessHours.days.join(", "));
      setHoursOpen(w.businessHours.open);
      setHoursClose(w.businessHours.close);
      setHoursTimezone(w.businessHours.timezone);
      setHoursAway(w.businessHours.awayMessage || "");
      setCanned(cn.canned);
      setTags(tg.tags);
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

  async function saveWidget() {
    try {
      const body: Partial<WidgetConfig> & { businessHours?: unknown } = {
        name: widgetName,
        greeting: widgetGreeting,
        primaryColor: widgetPrimary,
        accentColor: widgetAccent,
        showPoweredBy: widgetShowPowered,
        collectLead: widgetCollectLead,
        businessHours: {
          enabled: hoursEnabled,
          days: hoursDays
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          open: hoursOpen,
          close: hoursClose,
          timezone: hoursTimezone,
          awayMessage: hoursAway,
        },
      };
      const res = await webstackpro.patch<{ config: WidgetConfig }>("/settings/widget", body);
      setWidget(res.config);
      toastify("WebStackPro widget updated.");
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro widget update failed");
    }
  }

  async function addCanned(e: FormEvent) {
    e.preventDefault();
    if (!cannedTitle.trim() || !cannedBody.trim()) return;
    try {
      await webstackpro.post("/settings/canned", { title: cannedTitle, body: cannedBody });
      setCannedTitle("");
      setCannedBody("");
      toastify("WebStackPro canned reply added.");
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro canned reply failed");
    }
  }

  async function removeCanned(id: string) {
    try {
      await webstackpro.del(`/settings/canned/${id}`);
      toastify("WebStackPro canned reply removed.");
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro remove failed");
    }
  }

  async function addTag(e: FormEvent) {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
      await webstackpro.post("/settings/tags", { name: tagName, color: tagColor });
      setTagName("");
      toastify("WebStackPro tag added.");
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro tag failed");
    }
  }

  async function removeTag(id: string) {
    try {
      await webstackpro.del(`/settings/tags/${id}`);
      toastify("WebStackPro tag removed.");
      await loadAll();
    } catch (err) {
      toastify(err instanceof Error ? err.message : "WebStackPro remove failed");
    }
  }

  async function sendTestMessage(e: FormEvent) {
    e.preventDefault();
    if (!testText.trim() || testBusy) return;
    setTestBusy(true);
    setTestResult("");
    try {
      const res = await webstackpro.post<{ conversationId: string }>("/settings/test-message", { text: testText });
      setTestResult("Test message sent! It appears in your Inbox — the WebStackPro AI will reply within seconds.");
      setTestText("");
      try {
        localStorage.setItem("webstackpro_active_conversation", res.conversationId);
      } catch (_) {
        /* ignore */
      }
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "WebStackPro test message failed");
    } finally {
      setTestBusy(false);
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

        {/* ============ WIDGET CUSTOMIZATION ============ */}
        <Card id="widget" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Palette className="h-5 w-5 text-cyan-dark" /> WebStackPro Website Widget
            </CardTitle>
            <CardDescription>
              Brand the chat widget on your site: name, greeting, colors, lead capture and business hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-navy">Widget name</label>
                <Input value={widgetName} onChange={(e) => setWidgetName(e.target.value)} placeholder="Chat with us" className="mt-1" />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-navy">Primary color</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={widgetPrimary}
                      onChange={(e) => setWidgetPrimary(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-md border border-border"
                    />
                    <Input value={widgetPrimary} onChange={(e) => setWidgetPrimary(e.target.value)} className="h-9" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-navy">Accent color</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={widgetAccent}
                      onChange={(e) => setWidgetAccent(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-md border border-border"
                    />
                    <Input value={widgetAccent} onChange={(e) => setWidgetAccent(e.target.value)} className="h-9" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-navy">Greeting message</label>
              <Textarea
                value={widgetGreeting}
                onChange={(e) => setWidgetGreeting(e.target.value)}
                placeholder="Hi there! How can we help you today?"
                className="mt-1 min-h-[60px] text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={widgetCollectLead}
                  onChange={(e) => setWidgetCollectLead(e.target.checked)}
                  className="h-4 w-4 accent-cyan"
                />
                Ask visitors for their name + email before chatting
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={widgetShowPowered}
                  onChange={(e) => setWidgetShowPowered(e.target.checked)}
                  className="h-4 w-4 accent-cyan"
                />
                Show {`"Powered by WebStackPro"`}
              </label>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Business hours (AI + widget away message)
              </p>
              <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={hoursEnabled}
                  onChange={(e) => setHoursEnabled(e.target.checked)}
                  className="h-4 w-4 accent-cyan"
                />
                Enable business hours
              </label>
              {hoursEnabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-navy">Open days (comma separated)</label>
                    <Input value={hoursDays} onChange={(e) => setHoursDays(e.target.value)} placeholder="Mon, Tue, Wed, Thu, Fri" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy">Opens</label>
                      <Input type="time" value={hoursOpen} onChange={(e) => setHoursOpen(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy">Closes</label>
                      <Input type="time" value={hoursClose} onChange={(e) => setHoursClose(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy">Timezone</label>
                      <Input value={hoursTimezone} onChange={(e) => setHoursTimezone(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-navy">Away message</label>
                    <Input
                      value={hoursAway}
                      onChange={(e) => setHoursAway(e.target.value)}
                      placeholder="We're currently away, but we'll get back to you soon."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button variant="navy" onClick={saveWidget}>
              <Check className="h-4 w-4" /> Save WebStackPro Widget Settings
            </Button>
          </CardContent>
        </Card>

        {/* ============ TEST SIMULATOR ============ */}
        <Card id="test" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <FlaskConical className="h-5 w-5 text-cyan-dark" /> WebStackPro Test Simulator
            </CardTitle>
            <CardDescription>
              Send a test message as a customer to verify the full pipeline (inbox → AI → reply) works end-to-end.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendTestMessage} className="flex flex-col gap-3">
              <Input
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder='e.g. "What are your delivery options?" or "How do I contact you?"'
                className="flex-1"
              />
              <div className="flex items-center gap-3">
                <Button type="submit" variant="cyan" disabled={testBusy || !testText.trim()}>
                  {testBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  Send WebStackPro test message
                </Button>
                {testResult && <p className="text-xs font-medium text-green-600">{testResult}</p>}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ============ CANNED RESPONSES ============ */}
        <Card id="canned" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <MessageSquareQuote className="h-5 w-5 text-cyan-dark" /> WebStackPro Canned Responses
            </CardTitle>
            <CardDescription>Saved quick replies your human agents can reuse to answer faster.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addCanned} className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Input
                value={cannedTitle}
                onChange={(e) => setCannedTitle(e.target.value)}
                placeholder="Title (e.g. Delivery info)"
                className="sm:w-1/3"
              />
              <Input
                value={cannedBody}
                onChange={(e) => setCannedBody(e.target.value)}
                placeholder="The saved reply text..."
                className="flex-1"
              />
              <Button type="submit" variant="navy" disabled={!cannedTitle.trim() || !cannedBody.trim()}>
                <Plus className="h-4 w-4" /> Add Reply
              </Button>
            </form>

            <div className="space-y-2">
              {canned.map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-navy">{c.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.body}</p>
                  </div>
                  <button
                    onClick={() => removeCanned(c.id)}
                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove canned reply"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {canned.length === 0 && (
                <p className="text-sm text-muted-foreground">No WebStackPro canned responses yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============ TAGS ============ */}
        <Card id="tags" className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <TagIcon className="h-5 w-5 text-cyan-dark" /> WebStackPro Tags
            </CardTitle>
            <CardDescription>Labels you can attach to contacts from the Inbox to organise follow-ups (VIP, Lead, Awaiting Reply…).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTag} className="mb-4 flex items-end gap-3">
              <div className="flex-1">
                <Input
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="New tag name (e.g. VIP)"
                />
              </div>
              <div>
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border"
                  title="Tag color"
                />
              </div>
              <Button type="submit" variant="navy" disabled={!tagName.trim()}>
                <Plus className="h-4 w-4" /> Add Tag
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: t.color || "#00D4FF" }}
                >
                  <TagIcon className="h-3 w-3" /> {t.name}
                  <button
                    onClick={() => removeTag(t.id)}
                    className="rounded-full p-0.5 text-white/70 transition hover:bg-white/20 hover:text-white"
                    aria-label={`Delete ${t.name} tag`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && <p className="text-sm text-muted-foreground">No WebStackPro tags yet.</p>}
            </div>
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