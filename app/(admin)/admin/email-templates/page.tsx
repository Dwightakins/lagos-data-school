"use client";

import { useEffect, useState } from "react";
import { Mail, Save, Eye } from "lucide-react";
import type { EmailTemplate } from "@/types";

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email-templates").then((r) => r.json()).then((d) => {
      const tmpl: EmailTemplate[] = d.templates ?? [];
      setTemplates(tmpl);
      if (tmpl.length > 0) { setSelected(tmpl[0]); setSubject(tmpl[0].subject); setBody(tmpl[0].html_body); }
    });
  }, []);

  function selectTemplate(t: EmailTemplate) {
    setSelected(t); setSubject(t.subject); setBody(t.html_body); setPreview(false);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/admin/email-templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, subject, html_body: body }) });
    setSaving(false);
    setTemplates((prev) => prev.map((t) => t.id === selected.id ? { ...t, subject, html_body: body } : t));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const TEMPLATE_LABELS: Record<string, string> = {
    welcome: "Welcome Email",
    enrollment_confirmation: "Enrollment Confirmation",
    scholarship_approved: "Scholarship Approved",
    scholarship_rejected: "Scholarship Rejected",
    certificate_issued: "Certificate Issued",
    password_reset: "Password Reset",
    payment_receipt: "Payment Receipt",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
        <h1 className="text-[1.75rem] font-bold text-foreground">Email Templates</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Customize transactional email content</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Template list */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {templates.map((t) => (
              <button key={t.id} onClick={() => selectTemplate(t)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border last:border-0 transition-colors ${selected?.id === t.id ? "bg-brand/8 border-l-2 border-l-brand" : "hover:bg-muted/30"}`}>
                <Mail className={`w-4 h-4 shrink-0 ${selected?.id === t.id ? "text-brand" : "text-muted-foreground"}`} />
                <span className={`text-[13px] font-medium ${selected?.id === t.id ? "text-foreground" : "text-muted-foreground"}`}>{TEMPLATE_LABELS[t.template_key] ?? t.template_key}</span>
              </button>
            ))}
            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-[13px]">No templates found.</div>
            )}
          </div>
        </div>

        {/* Editor */}
        {selected && (
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <span className="text-[14px] font-semibold text-foreground">{TEMPLATE_LABELS[selected.template_key] ?? selected.template_key}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreview(!preview)} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors">
                  <Eye className="w-3.5 h-3.5" /> {preview ? "Edit" : "Preview"}
                </button>
                <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-[12px] bg-brand hover:bg-brand/90 disabled:opacity-50 text-foreground font-medium px-4 py-1.5 rounded-lg transition-colors">
                  <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : saved ? "Saved!" : "Save"}
                </button>
              </div>
            </div>

            {preview ? (
              <div className="flex-1 overflow-auto p-4">
                <div className="bg-card rounded-xl p-6 border border-border/50 min-h-full" dangerouslySetInnerHTML={{ __html: body }} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4 gap-3 overflow-auto">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Subject Line</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-brand/50" />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">HTML Body</label>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} className="flex-1 min-h-[400px] border border-border rounded-xl px-3 py-2 text-[12px] font-mono bg-background focus:outline-none focus:border-brand/50 resize-none" />
                  <p className="text-[11px] text-muted-foreground mt-1.5">Supports HTML. Use {"{{name}}"}, {"{{course_name}}"}, {"{{certificate_url}}"} as placeholders.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



