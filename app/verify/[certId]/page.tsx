import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { CheckCircle2, XCircle, Award, Calendar, BookOpen, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Certificate — Lagos Data School Limited",
  description: "Instantly verify the authenticity of a Lagos Data School certificate.",
};

interface CertificateData {
  id: string;
  issued_at: string;
  certificate_number?: string;
  users: { full_name: string } | null;
  courses: { title: string } | null;
}

async function getCertificate(certId: string): Promise<CertificateData | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("certificates")
    .select("id, issued_at, certificate_number, users(full_name), courses(title)")
    .eq("id", certId)
    .single();
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
        {certificate ? (
          <div className="bg-card rounded-2xl border-2 border-brand/30 p-8 shadow-elevated">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-brand/10 border-2 border-brand/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.24em] mb-0.5">Verified</p>
                <h2 className="text-[1.25rem] font-bold text-foreground">Certificate is Authentic</h2>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Student</p>
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
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Issued</p>
                  <p className="text-[15px] font-bold text-foreground">
                    {new Date(certificate.issued_at).toLocaleDateString("en-NG", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {certificate.certificate_number && (
                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Certificate Number</p>
                    <p className="text-[15px] font-bold text-foreground font-mono">{certificate.certificate_number}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 bg-muted rounded-xl border border-border px-4 py-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                This certificate was issued by Lagos Data School Limited and is on record in our official
                registry. Certificate ID:{" "}
                <span className="font-mono font-medium text-foreground">{certificate.id}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border-2 border-border p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-muted border-2 border-border flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-[1.25rem] font-bold text-foreground mb-2">Certificate Not Found</h2>
            <p className="text-[14px] text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              No certificate matching this ID was found in our records. It may have been entered
              incorrectly or may not exist.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-brand font-semibold text-[14px] hover:underline"
            >
              ← Return to Home
            </Link>
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
