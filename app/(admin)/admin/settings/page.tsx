"use client";

import { useState } from "react";
import { Settings, Globe, Mail, Phone, DollarSign, GraduationCap, Save } from "lucide-react";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all";

interface Section {
  icon: React.ReactNode;
  title: string;
  description: string;
  fields: Field[];
}

interface Field {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "url";
  placeholder: string;
  hint?: string;
}

const SECTIONS: Section[] = [
  {
    icon: <Globe className="w-4 h-4" />,
    title: "Platform",
    description: "Core information about your school.",
    fields: [
      { key: "school_name", label: "School Name", type: "text", placeholder: "Lagos Data School" },
      { key: "school_url", label: "Website URL", type: "url", placeholder: "https://lagosdataschool.com" },
      { key: "support_email", label: "Support Email", type: "email", placeholder: "support@lagosdataschool.com" },
    ],
  },
  {
    icon: <Phone className="w-4 h-4" />,
    title: "Contact",
    description: "Contact channels shown to students.",
    fields: [
      { key: "whatsapp_number", label: "WhatsApp Number", type: "tel", placeholder: "+2348012345678" },
      { key: "phone_number", label: "Phone Number", type: "tel", placeholder: "+2348012345678" },
    ],
  },
  {
    icon: <DollarSign className="w-4 h-4" />,
    title: "Payments",
    description: "Default pricing and payment settings.",
    fields: [
      { key: "default_course_price", label: "Default Course Price (₦)", type: "number", placeholder: "250000" },
      { key: "scholarship_fee", label: "Scholarship Processing Fee (₦)", type: "number", placeholder: "15000", hint: "Amount scholarship applicants pay after approval." },
    ],
  },
  {
    icon: <GraduationCap className="w-4 h-4" />,
    title: "Certificates",
    description: "Certificate issuance settings.",
    fields: [
      { key: "cert_issuer_name", label: "Certificate Issuer Name", type: "text", placeholder: "Lagos Data School" },
      { key: "cert_signatory", label: "Signatory Name & Title", type: "text", placeholder: "Director, Lagos Data School" },
    ],
  },
  {
    icon: <Mail className="w-4 h-4" />,
    title: "Email",
    description: "Sender details for all outgoing emails.",
    fields: [
      { key: "email_from_name", label: "From Name", type: "text", placeholder: "Lagos Data School" },
      { key: "email_from_address", label: "From Address", type: "email", placeholder: "noreply@lagosdataschool.com" },
      { key: "email_reply_to", label: "Reply-To Address", type: "email", placeholder: "support@lagosdataschool.com" },
    ],
  },
];

const DEFAULT_VALUES: Record<string, string> = {
  school_name: "Lagos Data School",
  school_url: "",
  support_email: "",
  whatsapp_number: "",
  phone_number: "",
  default_course_price: "250000",
  scholarship_fee: "15000",
  cert_issuer_name: "Lagos Data School",
  cert_signatory: "",
  email_from_name: "Lagos Data School",
  email_from_address: "",
  email_reply_to: "",
};

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [toast, setToast] = useState("");

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // Settings are environment-based for this deployment.
    // This form shows current config and notes what to update in .env / Supabase dashboard.
    setToast("Settings noted — update the relevant environment variables or Supabase config to apply.");
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl max-w-sm text-center">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-5 h-5 text-brand" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground text-[14px]">Platform configuration for Lagos Data School.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
              <span className="text-brand">{section.icon}</span>
              <div>
                <h2 className="text-[14px] font-bold text-foreground">{section.title}</h2>
                <p className="text-[12px] text-muted-foreground">{section.description}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={values[field.key] ?? ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={INPUT}
                  />
                  {field.hint && (
                    <p className="text-[11.5px] text-muted-foreground mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-[13px] text-amber-800">
          <strong>Note:</strong> Some settings (Paystack keys, Supabase credentials, Resend API key) are managed as environment variables in your deployment. Update those in your hosting provider&apos;s environment config.
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[14px] px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </form>
    </div>
  );
}
