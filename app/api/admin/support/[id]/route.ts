import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json() as { status?: string; reply?: string };

  const admin = createAdminClient();

  if (body.status) {
    const { error } = await admin.from("support_tickets").update({ status: body.status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.reply?.trim()) {
    const { data: ticket } = await admin.from("support_tickets").select("user_id, subject").eq("id", id).single();
    if (ticket) {
      await admin.from("messages").insert({
        sender_id: auth.userId,
        recipient_id: ticket.user_id,
        subject: `Re: ${ticket.subject}`,
        body: body.reply.trim(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
