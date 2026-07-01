import { createAdminClient } from "@/lib/supabase/admin";
import { CheckCircle, XCircle, Award } from "lucide-react";

interface PageProps { params: Promise<{ certId: string }> }

export default async function CertificateVerifyPage({ params }: PageProps) {
  const { certId } = await params;
  const admin = createAdminClient();

  const { data: cert } = await admin
    .from("certificates")
    .select("*, users(full_name), courses(title)")
    .or(`id.eq.${certId},certificate_number.eq.${certId}`)
    .single();

  if (!cert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Certificate Not Found</h1>
          <p className="text-[14px] text-muted-foreground">No certificate with that ID exists in our records.</p>
          <p className="text-[12px] text-muted-foreground mt-4 font-mono bg-muted px-3 py-2 rounded-lg">{certId}</p>
        </div>
      </div>
    );
  }

  const isRevoked = cert.status === "revoked";
  const issuedDate = new Date(cert.issued_at as string).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header bar */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-6 h-6 text-brand" />
            <span className="text-[15px] font-bold text-foreground">Lagos Data School</span>
          </div>
          <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold">Certificate Verification Portal</p>
        </div>

        <div className={`bg-card border-2 rounded-2xl p-8 shadow-sm ${isRevoked ? "border-red-200" : "border-green-200"}`}>
          <div className="flex flex-col items-center text-center mb-6">
            {isRevoked ? (
              <XCircle className="w-14 h-14 text-red-500 mb-3" />
            ) : (
              <CheckCircle className="w-14 h-14 text-green-500 mb-3" />
            )}
            <h1 className={`text-xl font-bold mb-1 ${isRevoked ? "text-red-600" : "text-green-700"}`}>
              {isRevoked ? "Certificate Revoked" : "Certificate Verified"}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {isRevoked
                ? "This certificate has been revoked and is no longer valid."
                : "This certificate is authentic and was issued by Lagos Data School."}
            </p>
          </div>

          {!isRevoked && (
            <div className="divide-y divide-border text-[13px]">
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Recipient</span>
                <span className="font-bold text-foreground">{(cert.users as { full_name: string } | null)?.full_name ?? "—"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Course</span>
                <span className="font-bold text-foreground text-right ml-4">{(cert.courses as { title: string } | null)?.title ?? "—"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Issued On</span>
                <span className="font-bold text-foreground">{issuedDate}</span>
              </div>
              {cert.certificate_number && (
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground font-medium">Certificate No.</span>
                  <span className="font-mono text-[12px] text-foreground">{cert.certificate_number as string}</span>
                </div>
              )}
            </div>
          )}

          {isRevoked && cert.revoke_reason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-2">
              <p className="text-[12px] text-red-700 font-semibold mb-1">Revocation Reason</p>
              <p className="text-[13px] text-red-600">{cert.revoke_reason as string}</p>
            </div>
          )}
        </div>

        <p className="text-center text-[11.5px] text-muted-foreground mt-4">
          Verified at lagosdata.school · Questions? Contact <span className="text-brand">support@lagosdata.school</span>
        </p>
      </div>
    </div>
  );
}
