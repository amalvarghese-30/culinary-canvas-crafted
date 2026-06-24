/**
 * Minimal ESC/POS receipt generator for 58/80mm thermal printers.
 * Produces a Uint8Array of bytes that can be:
 *   - downloaded as `.bin` for printer drivers that accept raw input
 *   - sent via Web USB / Web Bluetooth (advanced)
 *   - piped to a network printer through a backend bridge
 */

const ESC = 0x1b;
const GS = 0x1d;

function bytes(str: string): number[] {
  // ESC/POS uses Code Page 437 / Latin-1 mostly. Strip out characters above
  // 0xFF (e.g. emoji) and replace rupee sign with "Rs." for safety.
  const cleaned = str.replace(/₹/g, "Rs.").replace(/[\u0100-\uffff]/g, "?");
  const out: number[] = [];
  for (let i = 0; i < cleaned.length; i++) out.push(cleaned.charCodeAt(i) & 0xff);
  return out;
}

export type ReceiptLine =
  | { type: "text"; text: string; bold?: boolean; align?: "left" | "center" | "right"; size?: 1 | 2 }
  | { type: "row"; left: string; right: string }
  | { type: "hr" }
  | { type: "feed"; lines?: number }
  | { type: "cut" };

export function buildReceipt(lines: ReceiptLine[]): Uint8Array {
  const out: number[] = [];

  // Initialize
  out.push(ESC, 0x40);

  for (const l of lines) {
    if (l.type === "text") {
      // align
      const a = l.align === "center" ? 1 : l.align === "right" ? 2 : 0;
      out.push(ESC, 0x61, a);
      // size
      const s = (l.size ?? 1) === 2 ? 0x11 : 0x00;
      out.push(GS, 0x21, s);
      // bold
      out.push(ESC, 0x45, l.bold ? 1 : 0);
      out.push(...bytes(l.text), 0x0a);
      out.push(ESC, 0x45, 0); // reset bold
      out.push(GS, 0x21, 0); // reset size
    } else if (l.type === "row") {
      // 32 char width by default
      const width = 32;
      const left = l.left.slice(0, width - 1);
      const right = l.right.slice(0, width - 1);
      const space = Math.max(1, width - left.length - right.length);
      out.push(ESC, 0x61, 0);
      out.push(...bytes(left + " ".repeat(space) + right), 0x0a);
    } else if (l.type === "hr") {
      out.push(...bytes("-".repeat(32)), 0x0a);
    } else if (l.type === "feed") {
      for (let i = 0; i < (l.lines ?? 1); i++) out.push(0x0a);
    } else if (l.type === "cut") {
      out.push(GS, 0x56, 0x00);
    }
  }

  return new Uint8Array(out);
}

export function downloadReceiptBin(bytes: Uint8Array, filename: string) {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
