"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Download, Receipt } from "lucide-react";

interface PaymentRow {
  id: string;
  amount: number;
  reference: string;
  status: string;
  created_at: string;
  courses: { title: string } | null;
  payment_intents: { payment_type: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("payments")
        .select("id, amount, reference, status, created_at, courses ( title ), payment_intents ( payment_type )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPayments((data ?? []) as unknown as PaymentRow[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
    </div>
  );

  return (
    <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[1.5rem] font-bold text-foreground mb-1">Payment History</h1>
        <p className="text-muted-foreground text-[14px]">{payments.length} transaction{payments.length !== 1 ? "s" : ""}</p>
      </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "paid", "pending", "failed"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors min-h-[44px] ${filter === f ? "bg-brand text-foreground border-[#0D9488]" : "bg-card text-muted-foreground border-border hover:border-[#0D9488]"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <Receipt className="w-10 h-10 text-brand mx-auto mb-3" />
            <p className="text-[15px] font-bold text-foreground mb-1">No payment history</p>
            <p className="text-[13px] text-muted-foreground">Your transactions will appear here after enrolling in a course.</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[13px] font-semibold text-foreground leading-snug flex-1">{p.courses?.title ?? "—"}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-[15px] font-black text-foreground">{formatNaira(p.amount)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                      {p.reference && <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate max-w-[160px]">{p.reference}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${(p.payment_intents?.payment_type === "scholarship") ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {p.payment_intents?.payment_type === "scholarship" ? "Scholarship" : "Full Pay"}
                      </span>
                      <a href={`/api/invoice/${p.id}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline">
                        <Download className="w-3 h-3" /> Receipt
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Date", "Course", "Amount", "Type", "Status", "Reference", "Receipt"].map((h) => (
                        <th key={h} className="text-left text-[12px] font-bold text-muted-foreground uppercase tracking-wide px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-4 text-[13px] text-muted-foreground whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-[13px] font-medium text-foreground max-w-[180px] truncate">
                          {p.courses?.title ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-[13.5px] font-bold text-foreground whitespace-nowrap">
                          {formatNaira(p.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${(p.payment_intents?.payment_type === "scholarship") ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {p.payment_intents?.payment_type === "scholarship" ? "Scholarship" : "Full Pay"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[12px] text-muted-foreground font-mono max-w-[130px] truncate">
                          {p.reference || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <a
                            href={`/api/invoice/${p.id}`}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                          >
                            <Download className="w-3 h-3" /> Receipt
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
    </div>
  );
}

