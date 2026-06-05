"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Coupon } from "@/types";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/coupons").then((r) => r.json()).then((d) => { setCoupons(d.coupons ?? []); setLoading(false); });
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !discountValue) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.toUpperCase(), discount_type: discountType, discount_value: Number(discountValue), max_uses: maxUses ? Number(maxUses) : null, expires_at: expiresAt || null, applies_to: "all", active: true }),
    });
    setSubmitting(false);
    if (res.ok) {
      const d = await res.json();
      setCoupons((prev) => [d.coupon, ...prev]);
      setCode(""); setDiscountValue(""); setMaxUses(""); setExpiresAt(""); setShowForm(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: !active } : c));
  }

  async function del(id: string) {
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
          <h1 className="text-[1.75rem] font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground text-[14px] mt-1">Manage discount codes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-foreground font-semibold px-4 py-2 rounded-xl text-[13px] transition-colors">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-[14px] font-bold text-foreground mb-5">Create Coupon</h2>
          <form onSubmit={create} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE20" className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background font-mono uppercase focus:outline-none focus:border-brand/50" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₦)</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Value</label>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "20" : "5000"} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-brand/50" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Max Uses (optional)</label>
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="100" className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-brand/50" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Expires At (optional)</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none focus:border-brand/50" />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" disabled={submitting || !code || !discountValue} className="flex-1 bg-brand hover:bg-brand/90 disabled:opacity-50 text-foreground font-semibold py-2 rounded-xl text-[13px] transition-colors">
                {submitting ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-border text-muted-foreground hover:text-foreground py-2 rounded-xl text-[13px] transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Discount</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Usage</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Expires</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No coupons yet.</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-foreground">{c.code}</td>
                  <td className="px-5 py-3 text-foreground">{c.discount_type === "percentage" ? `${c.discount_value}%` : `₦${c.discount_value.toLocaleString("en-NG")}`}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Never"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggle(c.id, c.active)} className={`flex items-center gap-1.5 text-[12px] font-medium ${c.active ? "text-green-600" : "text-muted-foreground"}`}>
                      {c.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => del(c.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

