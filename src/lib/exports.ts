/**
 * Client-side PDF + Excel export helpers.
 * Dynamic imports keep the heavy libs out of the initial bundle.
 */

export async function exportToExcel(rows: any[], filename: string, sheetName = "Report") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPDF(
  title: string,
  rows: { label: string; value: string }[],
  table?: { headers: string[]; data: (string | number)[][] },
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, 50);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let y = 90;
  for (const r of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(r.label + ":", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(r.value), 200, y);
    y += 18;
  }

  if (table) {
    y += 16;
    doc.setFont("helvetica", "bold");
    let x = 40;
    const colWidth = (doc.internal.pageSize.getWidth() - 80) / table.headers.length;
    for (const h of table.headers) {
      doc.text(h, x, y);
      x += colWidth;
    }
    y += 14;
    doc.setDrawColor(180);
    doc.line(40, y - 8, doc.internal.pageSize.getWidth() - 40, y - 8);
    doc.setFont("helvetica", "normal");
    for (const row of table.data) {
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = 60;
      }
      x = 40;
      for (const cell of row) {
        doc.text(String(cell).slice(0, 40), x, y);
        x += colWidth;
      }
      y += 14;
    }
  }

  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

export interface InvoiceItem {
  name: string;
  hsn: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmt: number;
  sgstAmt: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  restaurant: {
    name: string;
    address: string;
    gstin: string;
    phone: string;
  };
}

function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(num: number): string {
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) {
      const h = Math.floor(num / 100);
      return ones[h] + " Hundred" + (num % 100 ? " and " + convert(num % 100) : "");
    }
    if (num < 100000) {
      const t = Math.floor(num / 1000);
      return convert(t) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    }
    const l = Math.floor(num / 100000);
    return convert(l) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
  }

  const whole = Math.floor(n);
  const paise = Math.round((n - whole) * 100);
  let str = convert(whole) + " Rupees";
  if (paise > 0) str += " and " + convert(paise) + " Paise";
  str += " Only";
  return str;
}

export async function exportInvoicePDF(data: InvoiceData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 40;
  const right = w - margin;
  let y = 40;

  // ── Header ──────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.restaurant.name, margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.restaurant.address, margin, y);
  y += 13;
  doc.text(`GSTIN: ${data.restaurant.gstin}`, margin, y);
  y += 13;
  doc.text(`Phone: ${data.restaurant.phone}`, margin, y);

  // Right side — Invoice title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TAX INVOICE", right, 52, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y = 52;
  doc.text(`Invoice #: ${data.invoiceNumber}`, right, y + 18, { align: "right" });
  doc.text(`Date: ${data.date}`, right, y + 31, { align: "right" });

  // Divider
  y = 95;
  doc.setDrawColor(200);
  doc.line(margin, y, right, y);
  y += 16;

  // ── Customer Details ────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To:", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.customerName, margin, y);
  y += 12;
  doc.text(`Phone: ${data.customerPhone}`, margin, y);
  if (data.customerAddress) {
    y += 12;
    doc.text(data.customerAddress, margin, y);
  }
  y += 12;
  if (data.paymentMethod) {
    doc.text(`Payment: ${data.paymentMethod.toUpperCase()} | Status: ${data.paymentStatus || "Paid"}`, margin, y);
  }
  y += 20;

  // ── Table Header ────────────────────────────────────────
  type Align = "left" | "center" | "right";
  const colDefs: { label: string; x: number; w: number; align: Align }[] = [
    { label: "Item", x: margin, w: 180, align: "left" as Align },
    { label: "HSN/SAC", x: margin + 180, w: 65, align: "left" as Align },
    { label: "Qty", x: margin + 245, w: 30, align: "center" as Align },
    { label: "Rate", x: margin + 275, w: 55, align: "right" as Align },
    { label: "Amount", x: margin + 330, w: 65, align: "right" as Align },
  ];

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 6, right - margin, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  for (const c of colDefs) {
    doc.text(c.label, c.x, y + 3, { align: c.align });
  }
  y += 18;

  // ── Table Rows ──────────────────────────────────────────
  doc.setDrawColor(220);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (const item of data.items) {
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = 50;
    }
    const amount = +(item.rate * item.quantity).toFixed(2);
    const rowData = [
      { text: item.name.slice(0, 32), x: margin, align: "left" as const },
      { text: item.hsn, x: margin + 180, align: "left" as const },
      { text: String(item.quantity), x: margin + 245, align: "center" as const },
      { text: `₹${item.rate.toFixed(2)}`, x: margin + 275, align: "right" as const },
      { text: `₹${amount.toFixed(2)}`, x: margin + 330, align: "right" as const },
    ];
    for (const c of rowData) {
      doc.text(c.text, c.x, y, { align: c.align });
    }
    y += 14;
    doc.line(margin, y - 6, right, y - 6);
  }

  // ── Totals Block ────────────────────────────────────────
  y += 10;
  const totalX = right - 180;
  const valX = right;

  function totalRow(label: string, value: string, bold = false) {
    if (bold) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    doc.text(label, totalX, y);
    doc.text(value, valX, y, { align: "right" });
    y += 15;
  }

  totalRow("Taxable Value", `₹${data.subtotal.toFixed(2)}`);
  totalRow(`CGST @${data.cgstRate}%`, `₹${data.cgstAmt.toFixed(2)}`);
  totalRow(`SGST @${data.sgstRate}%`, `₹${data.sgstAmt.toFixed(2)}`);

  y += 2;
  doc.setDrawColor(0);
  doc.line(totalX - 20, y - 8, valX, y - 8);
  totalRow("Grand Total", `₹${data.total.toFixed(2)}`, true);

  y += 6;
  // Amount in words
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Amount in words: ${numberToWords(data.total)}`, margin, y);
  y += 22;

  // ── Bank Details ────────────────────────────────────────
  doc.setDrawColor(200);
  doc.line(margin, y - 8, right, y - 8);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Bank Details", margin, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.text("Bank: HDFC Bank | A/C: 12345678901234 | IFSC: HDFC0001234 | Branch: Khan Market, New Delhi", margin, y);

  // ── Footer ──────────────────────────────────────────────
  y += 28;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("Thank you for your order!", margin, y);
  y += 11;
  doc.text("This is a computer-generated invoice and does not require a physical signature.", margin, y);

  // ── Right-side signature block ──────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("For " + data.restaurant.name, right, y + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signatory", right, y + 15, { align: "right" });

  doc.save(`Invoice_${data.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
