"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Library, Upload, Trash2, BrainCircuit, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { webstackpro } from "@/lib/api";
import { formatMessageDate } from "@/lib/utils";

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  source: string;
  createdAt: string;
};

type ListResponse = { items: KnowledgeItem[] };
type TestResponse = { answer: string; confidence: number; sources: number };

/**
 * WebStackPro Knowledge Base dashboard — "Train Your WebStackPro AI".
 */
export function WebStackProKnowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResponse | null>(null);

  const [uploadError, setUploadError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await webstackpro.get<ListResponse>("/knowledge");
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createEntry(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await webstackpro.post("/knowledge", { title, content });
      setTitle("");
      setContent("");
      setMessage("WebStackPro AI trained with the new entry.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "WebStackPro save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      setUploadError("WebStackPro accepts .txt or .pdf only");
      return;
    }
    setUploadError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const token = localStorage.getItem("webstackpro_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/knowledge/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "WebStackPro upload failed");
      setMessage(`WebStackPro learned from "${file.name}" (${data.chunks} chunks).`);
      await load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "WebStackPro upload failed");
    }
  }

  async function deleteItem(id: string) {
    await webstackpro.del(`/knowledge/${id}`);
    setItems((s) => s.filter((i) => i.id !== id));
    setMessage("WebStackPro entry deleted.");
  }

  async function testAI(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await webstackpro.post<TestResponse>("/knowledge/test", { question });
      setTestResult(res);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "WebStackPro test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-navy">
            Train Your WebStackPro AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your documents, prices and FAQs so WebStackPro AI answers every customer correctly.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-cyan/40 bg-cyan/10 p-3 text-sm text-navy">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Manual entry */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <BrainCircuit className="h-5 w-5 text-cyan-dark" /> Add knowledge manually
              </CardTitle>
              <CardDescription>Write a Q&A WebStackPro AI should use.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createEntry} className="space-y-3">
                <Input
                  placeholder="Title — e.g. WebStackPro delivery time in Owerri"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Content — e.g. Q: What is WebStackPro delivery time in Owerri? A: WebStackPro customers get 24-48 hours delivery within Owerri."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button type="submit" variant="navy" disabled={saving}>
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" />}
                  Train WebStackPro AI
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Upload */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <Upload className="h-5 w-5 text-cyan-dark" /> Upload a document
              </CardTitle>
              <CardDescription>WebStackPro reads .txt and .pdf files to learn.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cyan/50 bg-cyan/5 p-8 text-center transition hover:bg-cyan/10">
                <Upload className="h-8 w-8 text-cyan-dark" />
                <span className="text-sm font-semibold text-navy">Click to upload .txt or .pdf</span>
                <span className="text-xs text-muted-foreground">Max 5MB · Embeddings stored in WebStackPro pgvector</span>
                <input type="file" accept=".txt,.pdf,application/pdf" className="hidden" onChange={uploadFile} />
              </label>
              {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Test chat */}
        <Card className="mt-6 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <BrainCircuit className="h-5 w-5 text-cyan-dark" /> Chat with your WebStackPro AI
            </CardTitle>
            <CardDescription>Ask a question the way a customer would. See if WebStackPro AI answers confidently.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testAI} className="flex gap-2">
              <Input
                placeholder="Try: What is your delivery time in Owerri?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <Button type="submit" variant="cyan" disabled={testing || !question.trim()}>
                {testing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                Ask
              </Button>
            </form>
            {testResult && (
              <div className="mt-4 rounded-xl bg-navy p-4 text-white">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-cyan">WebStackPro AI</span>
                  <Badge variant={testResult.confidence >= 0.8 ? "ai" : "human"}>
                    confidence {Math.round(testResult.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{testResult.answer}</p>
                <p className="mt-2 text-[10px] text-white/50">
                  Based on {testResult.sources} knowledge source{testResult.sources === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Knowledge list */}
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-navy">
            WebStackPro Knowledge Base ({items.length})
          </h2>
          {loading && <p className="text-sm text-muted-foreground">Loading WebStackPro knowledge...</p>}
          {!loading && items.length === 0 && (
            <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
              No knowledge yet. Add an entry or upload a file to train WebStackPro AI.
            </p>
          )}
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 transition hover:border-cyan/50">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan/15">
                  <Library className="h-4 w-4 text-cyan-dark" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-navy">{item.title}</p>
                    <Badge variant="muted" className="capitalize">{item.source}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Added {formatMessageDate(item.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}