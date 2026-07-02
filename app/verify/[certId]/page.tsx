import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { CheckCircle2, XCircle, Award, Calendar, BookOpen, User, Download, AlertTriangle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Certificate — Lagos Data School Limited",
  description: "Instantly verify the authenticity of a Lagos Data School certificate.",
};

interface CertificateData {
  id: string;
  issued_at: string;
  certificate_number: string | null;
  status: string;
  revoke_reason: string | null;
  pdf_url: string | null;
  users: { full_name: string } | null;
  courses: { title: string; duration?: string | null } | null;
}

async function getCertificate(certId: string): Promise<CertificateData | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("certificates")
    .select("id, issued_at, certificate_number, status, revoke_reason, pdf_url, users(full_name), courses(title, duration)")
    .or(`id.eq.${certId},certificate_number.eq.${certId}`)
    .maybeSingle();
  return data as unknown as CertificateData | null;
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const certificate = await getCertificate(certId);

  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      <section className="bg-foreground text-background py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Award className="w-10 h-10 text-brand mx-auto mb-4" />
          <h1 className="text-[2rem] font-black mb-2">Certificate Verification</h1>
          <p className="text-background/60 text-[15px]">
            Confirm the authenticity of a Lagos Data School certificate.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-16">
        {!certificate ? (
          <div className="bg-card rounded-2xl border-2 border-border p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-[1.25rem] font-bold text-foreground mb-2">Certificate Not Found</h2>
            <p className="text-[14px] text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              No certificate matching this ID was found in our records. Please check the ID and try again.
            </p>
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-[12px] text-muted-foreground mb-6 break-all">{certId}</div>
            <Link href="/" className="inline-flex items-center gap-2 text-brand font-semibold text-[14px] hover:underline">
              ← Return to Home
            </Link>
          </div>
        ) : certificate.status === "revoked" ? (
          <div className="bg-card rounded-2xl border-2 border-red-200 p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-[1.25rem] font-bold text-red-700 mb-2">Certificate Revoked</h2>
            <p className="text-[14px] text-muted-foreground mb-4">This certificate has been revoked and is no longer valid.</p>
            {certificate.revoke_reason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-4">
                <p className="text-[12px] font-bold text-red-700 uppercase tracking-wide mb-1">Reason</p>
                <p className="text-[13px] text-red-600">{certificate.revoke_reason}</p>
              </div>
            )}
            <Link href="/" className="inline-flex items-center gap-2 text-brand font-semibold text-[14px] hover:underline">← Return to Home</Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border-2 border-brand/30 p-8 shadow-elevated">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wide">✓ Verified</span>
                <h2 className="text-[1.25rem] font-bold text-foreground mt-0.5">Certificate is Authentic</h2>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Recipient</p>
                  <p className="text-[15px] font-bold text-foreground">{certificate.users?.full_name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Course</p>
                  <p className="text-[15px] font-bold text-foreground">{certificate.courses?.title ?? "—"}</p>
                </div>
              </div>
              {certificate.courses?.duration && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Duration</p>
                    <p className="text-[15px] font-bold text-foreground">{certificate.courses.duration}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Issued</p>
                  <p className="text-[15px] font-bold text-foreground">
                    {new Date(certificate.issued_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Certificate ID</p>
                  <p className="text-[15px] font-bold text-foreground font-mono">{certificate.certificate_number ?? certificate.id}</p>
                </div>
              </div>
            </div>

            {certificate.pdf_url && (
              <div className="mt-6">
                <a
                  href={certificate.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-brand hover:opacity-90 text-brand-foreground font-bold text-[14px] py-3 rounded-xl transition-opacity"
                >
                  <Download className="w-4 h-4" /> Download Certificate PDF
                </a>
              </div>
            )}

            <div className="mt-4 bg-muted rounded-xl border border-border px-4 py-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Issued by Lagos Data School Limited and recorded in our official registry.
                Certificate ID: <span className="font-mono font-medium text-foreground">{certificate.id}</span>
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-[12px] text-muted-foreground mt-8">
          Questions about this certificate?{" "}
          <a href="mailto:hello@lagosdataschool.com" className="text-brand hover:underline font-medium">
            Contact us
          </a>
        </p>
      </section>

      <FooterSection />
    </div>
  );
}
