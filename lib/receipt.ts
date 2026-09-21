export interface ReceiptData {
  reference: string;
  paidAt: string | null;
  studentName: string;
  studentId: string | null;
  courseName: string;
  amount: number;
  status: string;
}

const BRAND: [number, number, number] = [13, 148, 136];

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/images/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

// Client-side only (fetches the logo from /public and triggers a browser download).
export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 6, "F");

  const logo = await loadLogo();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 20, 14, 32, 13.3);
    } catch {
      // Logo is decorative — receipt still generates without it
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text("LAGOS DATA SCHOOL LIMITED", W - 20, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("125 Ijegun Road, Isheri Osun, Lagos, Nigeria", W - 20, 26, { align: "right" });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(20, 34, W - 20, 34);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text("Payment Receipt", 20, 50);

  // Details
  const rows: Array<[string, string]> = [
    ["Receipt No.", data.reference || "—"],
    ["Date", formatDate(data.paidAt)],
    ["Student Name", data.studentName || "—"],
    ["Student ID", data.studentId || "—"],
    ["Course", data.courseName || "—"],
    ["Payment Method", "ALAT Pay"],
    ["Payment Status", data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "—"],
  ];

  let y = 66;
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(label, 20, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(doc.splitTextToSize(value, 115), 75, y);
    y += 10;
  });

  // Amount box (Helvetica has no Naira glyph, so use "NGN")
  y += 4;
  doc.setFillColor(240, 250, 248);
  doc.roundedRect(20, y, W - 40, 22, 3, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Amount Paid", 28, y + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND);
  doc.text(`NGN ${data.amount.toLocaleString("en-NG")}`, 28, y + 18);

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 262, W - 20, 262);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("Thank you for choosing Lagos Data School Limited", W / 2, 271, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("support@lagosdataschoolltd.com", W / 2, 277, { align: "center" });

  const safeRef = (data.reference || "receipt").replace(/[^a-zA-Z0-9_-]/g, "-");
  doc.save(`LDSL-Receipt-${safeRef}.pdf`);
}
