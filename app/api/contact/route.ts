import { NextResponse } from "next/server";
import { sendEmail, SUPPORT_EMAIL } from "@/lib/emails";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Name, email, subject and message are required." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error: dbError } = await admin.from("contact_messages").insert({
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: "new",
    });

    if (dbError) {
      console.error("[contact] DB insert error:", dbError);
    }

    const sentAt = new Date().toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      dateStyle: "full",
      timeStyle: "short",
    });

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#0D9488;margin-bottom:4px">New Contact Message</h2>
        <p style="color:#64748B;font-size:13px;margin-top:0">Received via Lagos Data School website</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#64748B;font-size:13px;width:100px">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;font-size:13px">Email</td><td style="padding:6px 0;font-size:14px"><a href="mailto:${email}" style="color:#0D9488">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:6px 0;color:#64748B;font-size:13px">Phone</td><td style="padding:6px 0;font-size:14px">${phone}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#64748B;font-size:13px">Subject</td><td style="padding:6px 0;font-size:14px;font-weight:600">${subject}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;font-size:13px;vertical-align:top">Sent at</td><td style="padding:6px 0;font-size:13px">${sentAt} WAT</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <h3 style="font-size:14px;color:#374151;margin-bottom:8px">Message</h3>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;font-size:14px;line-height:1.7;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        <p style="margin-top:20px;font-size:13px;color:#64748B">Reply directly to <a href="mailto:${email}" style="color:#0D9488">${email}</a> to respond to this message.</p>
      </div>
    `;

    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `New Contact Message from ${name}`,
      html,
      replyTo: email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
