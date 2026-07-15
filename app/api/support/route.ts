import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, SUPPORT_EMAIL } from "@/lib/emails";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { courseId?: string; subject: string; message: string };
  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("support_tickets")
    .insert({
      user_id: user.id,
      course_id: body.courseId || null,
      subject: body.subject.trim(),
      message: body.message.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email notification to support — fire and forget
  void (async () => {
    try {
      const { data: profile } = await admin
        .from("users")
        .select("full_name, email, student_id")
        .eq("id", user.id)
        .single();

      const { data: enrollments } = await admin
        .from("enrollments")
        .select("courses(title)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(5);

      const studentName = (profile as { full_name?: string } | null)?.full_name ?? "Unknown Student";
      const studentEmail = (profile as { email?: string } | null)?.email ?? user.email ?? "";
      const studentId = (profile as { student_id?: string } | null)?.student_id;
      const courseList = (enrollments ?? [])
        .map((e: { courses?: { title?: string } | null }) => e.courses?.title)
        .filter(Boolean)
        .join(", ") || "None";

      const sentAt = new Date().toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        dateStyle: "full",
        timeStyle: "short",
      });

      await sendEmail({
        to: SUPPORT_EMAIL,
        subject: `New Support Ticket from ${studentName}`,
        replyTo: studentEmail,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
            <h2 style="color:#0D9488;margin-bottom:4px">New Support Ticket</h2>
            <p style="color:#64748B;font-size:13px;margin-top:0">Submitted via student dashboard</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748B;font-size:13px;width:120px">Student</td><td style="padding:6px 0;font-size:14px;font-weight:600">${studentName}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;font-size:13px">Email</td><td style="padding:6px 0;font-size:14px"><a href="mailto:${studentEmail}" style="color:#0D9488">${studentEmail}</a></td></tr>
              ${studentId ? `<tr><td style="padding:6px 0;color:#64748B;font-size:13px">Student ID</td><td style="padding:6px 0;font-size:14px">${studentId}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#64748B;font-size:13px">Courses</td><td style="padding:6px 0;font-size:14px">${courseList}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;font-size:13px">Subject</td><td style="padding:6px 0;font-size:14px;font-weight:600">${body.subject.trim()}</td></tr>
              <tr><td style="padding:6px 0;color:#64748B;font-size:13px;vertical-align:top">Sent at</td><td style="padding:6px 0;font-size:13px">${sentAt} WAT</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <h3 style="font-size:14px;color:#374151;margin-bottom:8px">Message</h3>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;font-size:14px;line-height:1.7;white-space:pre-wrap">${body.message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            <p style="margin-top:20px;font-size:13px;color:#64748B">
              Reply directly to <a href="mailto:${studentEmail}" style="color:#0D9488">${studentEmail}</a> or manage this ticket in the
              <a href="https://lagosdataschool.com/admin/support" style="color:#0D9488">admin panel</a>.
            </p>
          </div>
        `,
      });
    } catch {
      // Non-critical — ticket is already saved
    }
  })();

  return NextResponse.json({ ticket: data });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}
