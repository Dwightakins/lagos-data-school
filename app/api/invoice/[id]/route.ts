import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PaymentRecord {
  id: string;
  amount: number;
  reference: string;
  status: string;
  created_at: string;
  provider: string | null;
  courses: { title: string } | null;
  payment_intents: { payment_type: string } | null;
}

interface StudentRecord {
  full_name: string | null;
  student_id: string | null;
}

async function buildReceiptPdf(
  payment: PaymentRecord,
  student: StudentRecord | null
): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  // Teal header bar
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, W, 42, "F");

  // Official logo — left side of the header (PNG is 3:2, white background)
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const logoData = await readFile(join(process.cwd(), "public", "images", "logo.png"));
    doc.addImage(`data:image/png;base64,${logoData.toString("base64")}`, "PNG", 14, 8, 26, 17.3);
  } catch {
    // Logo is decorative — receipt still generates without it
  }

  // School name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("LAGOS DATA SCHOOL LIMITED", W / 2, 16, { align: "center" });

  // Receipt title
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 240, 235);
  doc.text("PAYMENT RECEIPT", W / 2, 25, { align: "center" });

  // Thin white rule
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(20, 30, W - 20, 30);

  // Sub-header: receipt ref + date
  doc.setFontSize(8.5);
  doc.setTextColor(220, 255, 250);
  const receiptNo = `LDSL-${payment.id.slice(0, 8).toUpperCase()}`;
  const payDate = new Date(payment.created_at).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Receipt No: ${receiptNo}`, 20, 37);
  doc.text(`Date: ${payDate}`, W - 20, 37, { align: "right" });

  // White body
  let y = 58;

  const labelColor: [number, number, number] = [100, 116, 139];
  const valueColor: [number, number, number] = [15, 23, 42];

  function row(label: string, value: string) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...labelColor);
    doc.text(label.toUpperCase(), 20, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...valueColor);
    doc.text(value, 20, y + 5.5);

    y += 16;
  }

  // "Billed to" section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, W - 28, 32, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...labelColor);
  doc.text("BILLED TO", 20, 58);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...valueColor);
  doc.text(student?.full_name ?? "Student", 20, 65);

  if (student?.student_id) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...labelColor);
    doc.text(`Student ID: ${student.student_id}`, 20, 71);
  }

  y = 96;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, y - 4, W - 14, y - 4);

  row("Course", payment.courses?.title ?? "—");
  row("Amount Paid", `₦${Number(payment.amount).toLocaleString("en-NG")}`);
  row("Payment Type", payment.payment_intents?.payment_type === "scholarship" ? "Scholarship" : "Full Pay");
  row("Payment Method", "Paystack");
  row("Transaction Reference", payment.reference || "—");

  // Status badge
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(14, y, 60, 14, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(21, 128, 61);
  doc.text("STATUS", 18, y + 5);
  doc.setFontSize(11);
  doc.text(payment.status.toUpperCase(), 18, y + 11);

  // PAID stamp (top-right area, light green)
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(187, 247, 208); // light green
  doc.text("PAID", W - 20, y + 12, { align: "right", angle: -15 });
  doc.setTextColor(...valueColor); // reset

  // Footer
  const footerY = 265;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, footerY, W - 14, footerY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...labelColor);
  doc.text("Thank you for choosing Lagos Data School Limited.", W / 2, footerY + 7, { align: "center" });
  doc.text("For support: support@lagosdataschoolltd.com", W / 2, footerY + 13, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Lagos Data School Limited — Built in Lagos. Designed for Africa.", W / 2, footerY + 20, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount, reference, status, created_at, provider, user_id, courses(title), payment_intents(payment_type)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const { data: student } = await admin
    .from("users")
    .select("full_name, student_id")
    .eq("id", user.id)
    .single();

  const pdfBuffer = await buildReceiptPdf(
    payment as unknown as PaymentRecord,
    student as unknown as StudentRecord | null
  );

  const dateStr = new Date((payment as { created_at: string }).created_at).toISOString().slice(0, 10);

  return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LDSL-Receipt-${dateStr}.pdf"`,
    },
  });
}
