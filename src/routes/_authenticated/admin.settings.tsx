import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

type SettingsData = {
  restaurantName: string;
  tagline: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  hours: string;
  openingTime: string;
  closingTime: string;
  gstin: string;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string; youtube?: string };
  deliveryConfig: { minOrderForDelivery?: number; deliveryFee?: number; freeDeliveryThreshold?: number; estimatedTime?: string };
  meta: { seoTitle?: string; seoDescription?: string; ogImage?: string };
};

const EMPTY_FORM = {
  restaurantName: "",
  tagline: "",
  phone: "",
  phoneDisplay: "",
  email: "",
  address: "",
  city: "",
  pincode: "",
  hours: "",
  openingTime: "",
  closingTime: "",
  gstin: "",
  instagram: "",
  facebook: "",
  twitter: "",
  youtube: "",
  minOrder: "",
  deliveryFee: "",
  freeThreshold: "",
  estimatedTime: "",
  seoTitle: "",
  seoDescription: "",
  ogImage: "",
};

function mapToForm(s: SettingsData | null) {
  if (!s) return { ...EMPTY_FORM };
  return {
    restaurantName: s.restaurantName ?? "",
    tagline: s.tagline ?? "",
    phone: s.phone ?? "",
    phoneDisplay: s.phoneDisplay ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    city: s.city ?? "",
    pincode: s.pincode ?? "",
    hours: s.hours ?? "",
    openingTime: s.openingTime ?? "",
    closingTime: s.closingTime ?? "",
    gstin: s.gstin ?? "",
    instagram: s.socialLinks?.instagram ?? "",
    facebook: s.socialLinks?.facebook ?? "",
    twitter: s.socialLinks?.twitter ?? "",
    youtube: s.socialLinks?.youtube ?? "",
    minOrder: s.deliveryConfig?.minOrderForDelivery?.toString() ?? "",
    deliveryFee: s.deliveryConfig?.deliveryFee?.toString() ?? "",
    freeThreshold: s.deliveryConfig?.freeDeliveryThreshold?.toString() ?? "",
    estimatedTime: s.deliveryConfig?.estimatedTime ?? "",
    seoTitle: s.meta?.seoTitle ?? "",
    seoDescription: s.meta?.seoDescription ?? "",
    ogImage: s.meta?.ogImage ?? "",
  };
}

export default function AdminSettingsPage() {
  const { data, loading, refetch } = useApiQuery("admin-settings", () =>
    apiFetch("/api/settings")
  );

  const [form, setForm] = useState(mapToForm(null));

  useEffect(() => {
    if (data) setForm(mapToForm(data as SettingsData));
  }, [data]);

  const { mutate: doSave, loading: saving } = useApiMutation(
    (_empty?: void) => {
      const payload: Record<string, any> = {
        restaurant_name: form.restaurantName,
        tagline: form.tagline || null,
        phone: form.phone,
        phone_display: form.phoneDisplay || null,
        email: form.email || null,
        address: form.address,
        city: form.city || null,
        pincode: form.pincode || null,
        hours: form.hours,
        opening_time: form.openingTime || null,
        closing_time: form.closingTime || null,
        gstin: form.gstin || null,
        social_links: {
          instagram: form.instagram || null,
          facebook: form.facebook || null,
          twitter: form.twitter || null,
          youtube: form.youtube || null,
        },
        delivery_config: {
          min_order: form.minOrder ? Number(form.minOrder) : 0,
          fee: form.deliveryFee ? Number(form.deliveryFee) : 0,
          free_threshold: form.freeThreshold ? Number(form.freeThreshold) : 0,
          estimated_time: form.estimatedTime || null,
        },
        meta: {
          seo_title: form.seoTitle || null,
          seo_description: form.seoDescription || null,
          og_image: form.ogImage || null,
        },
      };
      return apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(payload) });
    },
    {
      onSuccess: () => {
        toast.success("Settings saved");
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Settings</h2>
          <p className="text-sm text-muted-foreground">Restaurant info, delivery config, and SEO</p>
        </div>
        <button
          onClick={() => doSave(undefined)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-glow disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </button>
      </div>

      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); doSave(undefined); }}>
        {/* Restaurant Info */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4">Restaurant Info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.restaurantName} onChange={(v) => set("restaurantName", v)} />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
            <Field label="Phone (E.164)" value={form.phone} onChange={(v) => set("phone", v)} placeholder="911234567890" />
            <Field label="Phone Display" value={form.phoneDisplay} onChange={(v) => set("phoneDisplay", v)} placeholder="+91 12345 67890" />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" />
            <Field label="GSTIN" value={form.gstin} onChange={(v) => set("gstin", v)} />
          </div>
        </section>

        {/* Address */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4">Address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address" value={form.address} onChange={(v) => set("address", v)} />
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} />
            <Field label="Hours" value={form.hours} onChange={(v) => set("hours", v)} placeholder="Daily 11:00 AM – 11:30 PM" />
            <Field label="Opening Time" value={form.openingTime} onChange={(v) => set("openingTime", v)} placeholder="11:00" />
            <Field label="Closing Time" value={form.closingTime} onChange={(v) => set("closingTime", v)} placeholder="23:30" />
          </div>
        </section>

        {/* Social Links */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4">Social Links</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instagram URL" value={form.instagram} onChange={(v) => set("instagram", v)} />
            <Field label="Facebook URL" value={form.facebook} onChange={(v) => set("facebook", v)} />
            <Field label="Twitter URL" value={form.twitter} onChange={(v) => set("twitter", v)} />
            <Field label="YouTube URL" value={form.youtube} onChange={(v) => set("youtube", v)} />
          </div>
        </section>

        {/* Delivery Config */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4">Delivery</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Min Order (₹)" value={form.minOrder} onChange={(v) => set("minOrder", v)} type="number" />
            <Field label="Delivery Fee (₹)" value={form.deliveryFee} onChange={(v) => set("deliveryFee", v)} type="number" />
            <Field label="Free Delivery Threshold (₹)" value={form.freeThreshold} onChange={(v) => set("freeThreshold", v)} type="number" />
            <Field label="Estimated Time" value={form.estimatedTime} onChange={(v) => set("estimatedTime", v)} placeholder="25-35 min" />
          </div>
        </section>

        {/* SEO */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4">SEO & Meta</h3>
          <div className="grid gap-4">
            <Field label="SEO Title" value={form.seoTitle} onChange={(v) => set("seoTitle", v)} />
            <Field label="SEO Description" value={form.seoDescription} onChange={(v) => set("seoDescription", v)} />
            <Field label="OG Image URL" value={form.ogImage} onChange={(v) => set("ogImage", v)} />
          </div>
        </section>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        placeholder={placeholder}
      />
    </label>
  );
}
