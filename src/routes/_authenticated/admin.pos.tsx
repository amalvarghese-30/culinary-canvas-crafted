import { useState, useMemo } from "react";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { buildReceipt, downloadReceiptBin } from "@/lib/escpos";
import { exportInvoicePDF } from "@/lib/exports";
import { Loader2, Plus, Minus, Printer, Receipt, Trash2, FileText, Split, Download, Armchair, ShoppingBag, Bike } from "lucide-react";
import { toast } from "sonner";

type Item = { id: string; name: string; style: string; variant: string; price: number };
type Line = { id: string; name: string; price: number; quantity: number };
type Fulfillment = "dine-in" | "takeaway" | "delivery";

export default function POSPage() {
  const { data: items, loading: isLoading } = useApiQuery("pos-menu", () =>
    apiFetch("/api/admin/menu?lite=true")
  );

  const { data: tables } = useApiQuery("pos-tables", () =>
    apiFetch("/api/admin/tables")
  );

  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("Walk-in");
  const [phone, setPhone] = useState("0000000000");
  const [search, setSearch] = useState("");
  const [splitCount, setSplitCount] = useState(1);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("dine-in");
  const [tableId, setTableId] = useState("");

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);
  const tax = +(subtotal * 0.05).toFixed(2);
  const sgst = +(tax / 2).toFixed(2);
  const cgst = +(tax / 2).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const filtered: Item[] = (items ?? []).filter(
    (i: Item) => !search || `${i.style} ${i.variant} ${i.name}`.toLowerCase().includes(search.toLowerCase()),
  );

  function add(it: Item) {
    setLines((prev) => {
      const found = prev.find((l) => l.id === it.id);
      if (found) return prev.map((l) => l.id === it.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { id: it.id, name: `${it.style} ${it.variant}`, price: Number(it.price), quantity: 1 }];
    });
  }
  function inc(id: string, d: number) {
    setLines((prev) => prev.flatMap((l) => l.id === id ? (l.quantity + d <= 0 ? [] : [{ ...l, quantity: l.quantity + d }]) : [l]));
  }

  const { mutate: placeOrderFn, loading: isPlacing } = useApiMutation(
    () =>
      apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({ item_id: l.id, name: l.name, price: l.price, quantity: l.quantity })),
          fulfillment,
          customer_name: name,
          customer_phone: phone,
          notes: `${fulfillment === "dine-in" && tableId ? `Table ${tableId}` : ""} POS`.trim(),
          source: "pos",
          split_count: splitCount,
          table_id: fulfillment === "dine-in" ? tableId : undefined,
        }),
      }),
    {
      onSuccess: (res) => {
        toast.success(`Order ${(res as any).order_number} created`);
        setTimeout(() => printReceipt((res as any).order_number), 100);
        setLines([]);
        setSplitCount(1);
      },
      onError: (e) => toast.error(e.message || "Failed"),
    }
  );

  function downloadEscPos(orderNumber: string) {
    const perSplit = total / splitCount;
    const receipt = buildReceipt([
      { type: "text", text: "MOMO HOUSE", align: "center", size: 2, bold: true },
      { type: "text", text: "12 Lake Road, Khan Market", align: "center" },
      { type: "text", text: "GSTIN: 07AAAAA0000A1Z5", align: "center" },
      { type: "hr" },
      { type: "row", left: orderNumber, right: new Date().toLocaleTimeString() },
      { type: "text", text: `Customer: ${name}` },
      { type: "text", text: `Type: ${fulfillment}${tableId ? ` (Table)` : ""}` },
      { type: "hr" },
      ...lines.flatMap((l) => [
        {
          type: "row" as const,
          left: `${l.quantity}x ${l.name.slice(0, 22)}`,
          right: `Rs.${(l.price * l.quantity).toFixed(2)}`,
        },
      ]),
      { type: "hr" },
      { type: "row", left: "Subtotal", right: `Rs.${subtotal.toFixed(2)}` },
      { type: "row", left: "CGST 2.5%", right: `Rs.${cgst.toFixed(2)}` },
      { type: "row", left: "SGST 2.5%", right: `Rs.${sgst.toFixed(2)}` },
      { type: "row", left: "TOTAL", right: `Rs.${total.toFixed(2)}` },
      ...(splitCount > 1
        ? [{ type: "row" as const, left: `Split / ${splitCount}`, right: `Rs.${perSplit.toFixed(2)}` }]
        : []),
      { type: "feed", lines: 1 },
      { type: "text", text: "Thank you! - momo.house", align: "center" },
      { type: "feed", lines: 3 },
      { type: "cut" },
    ]);
    downloadReceiptBin(receipt, `${orderNumber}.bin`);
    toast.success("ESC/POS receipt downloaded");
  }

  async function downloadPdf(orderNumber: string) {
    const invoiceItems = lines.map((l) => ({
      name: l.name,
      hsn: "21069099",
      quantity: l.quantity,
      rate: l.price,
    }));
    await exportInvoicePDF({
      invoiceNumber: orderNumber,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      customerName: name,
      customerPhone: phone,
      items: invoiceItems,
      subtotal,
      cgstRate: 2.5,
      sgstRate: 2.5,
      cgstAmt: cgst,
      sgstAmt: sgst,
      total,
      paymentMethod: "cash",
      paymentStatus: "Paid",
      restaurant: {
        name: "MOMO HOUSE",
        address: "12 Lake Road, Khan Market, New Delhi - 110003",
        gstin: "07AAAAA0000A1Z5",
        phone: "+91 98765 43210",
      },
    });
  }

  function printReceipt(orderNumber: string) {
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    w.document.write(`
      <html><head><title>${orderNumber}</title>
      <style>
        body{font-family:monospace;font-size:12px;padding:12px;width:300px}
        h1{font-size:14px;margin:0;text-align:center}
        .row{display:flex;justify-content:space-between}
        hr{border:none;border-top:1px dashed #000;margin:6px 0}
        .center{text-align:center}.b{font-weight:bold}
      </style></head><body>
        <h1>MŌMO HOUSE</h1>
        <p class="center">12 Lake Road, Khan Market<br/>GSTIN: 07AAAAA0000A1Z5</p>
        <hr/>
        <div class="row"><span>${orderNumber}</span><span>${new Date().toLocaleString()}</span></div>
        <div>Customer: ${name}</div>
        <div>Type: ${fulfillment}</div>
        <hr/>
        ${lines.map((l) => `<div class="row"><span>${l.quantity}× ${l.name}</span><span>₹${(l.price * l.quantity).toFixed(2)}</span></div>`).join("")}
        <hr/>
        <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="row"><span>CGST 2.5%</span><span>₹${cgst.toFixed(2)}</span></div>
        <div class="row"><span>SGST 2.5%</span><span>₹${sgst.toFixed(2)}</span></div>
        <div class="row b"><span>TOTAL</span><span>₹${total.toFixed(2)}</span></div>
        <hr/>
        <p class="center">Thank you! · momo.house</p>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
    w.document.close();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5">
      <div>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display text-2xl">POS</h2>
          <input
            placeholder="Search dish…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-luxe max-w-sm"
          />
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filtered.map((it) => (
              <button
                key={it.id}
                onClick={() => add(it)}
                className="text-left rounded-xl ring-1 ring-border bg-card hover:ring-primary/40 p-3 transition"
              >
                <div className="font-medium text-sm">{it.style}</div>
                <div className="text-xs text-muted-foreground">{it.variant}</div>
                <div className="font-[var(--font-num)] text-primary mt-1">₹{Number(it.price).toFixed(0)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="rounded-2xl ring-1 ring-border bg-card p-4 h-fit sticky top-4 space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-primary" />
          <h3 className="font-semibold">Current bill</h3>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-background/60 ring-1 ring-border">
          {([
            { key: "dine-in" as Fulfillment, label: "Dine-in", icon: Armchair },
            { key: "takeaway" as Fulfillment, label: "Takeaway", icon: ShoppingBag },
            { key: "delivery" as Fulfillment, label: "Delivery", icon: Bike },
          ]).map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFulfillment(opt.key)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition ${
                  fulfillment === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
        {fulfillment === "dine-in" && (tables as any[])?.length > 0 && (
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="input-luxe text-sm w-full"
          >
            <option value="">No table</option>
            {(tables as any[]).map((t: any) => (
              <option key={t._id} value={t._id}>{t.name} ({t.capacity}p)</option>
            ))}
          </select>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Customer" value={name} onChange={(e) => setName(e.target.value)} className="input-luxe text-sm" />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-luxe text-sm" />
        </div>
        <div className="max-h-[40vh] overflow-y-auto divide-y divide-border">
          {lines.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No items.</p>}
          {lines.map((l) => (
            <div key={l.id} className="py-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{l.name}</div>
                <div className="text-xs text-muted-foreground font-[var(--font-num)]">₹{l.price} × {l.quantity}</div>
              </div>
              <button onClick={() => inc(l.id, -1)} className="size-7 rounded ring-1 ring-border grid place-items-center"><Minus className="size-3" /></button>
              <button onClick={() => inc(l.id, 1)} className="size-7 rounded ring-1 ring-border grid place-items-center"><Plus className="size-3" /></button>
              <button onClick={() => inc(l.id, -l.quantity)} className="size-7 rounded ring-1 ring-destructive/40 text-destructive grid place-items-center"><Trash2 className="size-3" /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-[var(--font-num)]">₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>CGST 2.5%</span><span className="font-[var(--font-num)]">₹{cgst.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>SGST 2.5%</span><span className="font-[var(--font-num)]">₹{sgst.toFixed(2)}</span></div>
          <div className="flex justify-between text-base pt-2 border-t border-border mt-2">
            <span className="font-medium">Total</span>
            <span className="font-[var(--font-num)] text-primary">₹{total.toFixed(2)}</span>
          </div>
          {splitCount > 1 && (
            <div className="flex justify-between text-success">
              <span>Per person (÷{splitCount})</span>
              <span className="font-[var(--font-num)]">₹{(total / splitCount).toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="rounded-lg ring-1 ring-border bg-background/40 p-2 flex items-center gap-2 text-sm">
          <Split className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground">Split bill</span>
          <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="size-6 rounded ring-1 ring-border">−</button>
          <span className="w-6 text-center font-[var(--font-num)]">{splitCount}</span>
          <button onClick={() => setSplitCount(Math.min(10, splitCount + 1))} className="size-6 rounded ring-1 ring-border">+</button>
        </div>
        <button
          disabled={lines.length === 0 || isPlacing}
          onClick={() => placeOrderFn(undefined as any)}
          className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <Printer className="size-4" />
          {isPlacing ? "Saving…" : "Save & print receipt"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={lines.length === 0} onClick={() => downloadEscPos("PREVIEW")} className="rounded-xl ring-1 ring-border py-2 text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50">
            <Download className="size-3" /> ESC/POS .bin
          </button>
          <button disabled={lines.length === 0} onClick={() => downloadPdf("PREVIEW")} className="rounded-xl ring-1 ring-border py-2 text-xs font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50">
            <FileText className="size-3" /> PDF invoice
          </button>
        </div>
      </aside>
    </div>
  );
}
