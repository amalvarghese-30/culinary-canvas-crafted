import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Flame, ChevronDown, ChevronRight } from "lucide-react";

type Item = {
  id: string;
  name: string;
  slug: string;
  style: string;
  variant: string;
  description: string;
  short_description: string | null;
  price: number;
  category: string;
  sub_category: string | null;
  filling: string | null;
  piece_count: number | null;
  spice: number;
  image_url: string | null;
  gallery_images: string[];
  badges: string[];
  sort_order: number;
  available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_chef_special: boolean;
  preparation_time: number | null;
  ingredients: string | null;
  nutritional_info: { calories?: number; protein?: number; carbs?: number; fat?: number } | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
};

type FormState = {
  id?: string;
  name: string;
  slug: string;
  style: string;
  variant: string;
  description: string;
  short_description: string;
  price: number;
  category: string;
  sub_category: string;
  filling: string;
  piece_count: number | null;
  spice: number;
  image_url: string;
  gallery_images: string;
  badges: string;
  sort_order: number;
  available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_chef_special: boolean;
  preparation_time: number | null;
  ingredients: string;
  nutritional_calories: number | null;
  nutritional_protein: number | null;
  nutritional_carbs: number | null;
  nutritional_fat: number | null;
  seo_title: string;
  seo_description: string;
  tags: string;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  style: "",
  variant: "Veg",
  description: "",
  short_description: "",
  price: 100,
  category: "",
  sub_category: "",
  filling: "",
  piece_count: null,
  spice: 1,
  image_url: "",
  gallery_images: "",
  badges: "",
  sort_order: 999,
  available: true,
  is_vegetarian: true,
  is_vegan: false,
  is_gluten_free: false,
  is_featured: false,
  is_best_seller: false,
  is_chef_special: false,
  preparation_time: null,
  ingredients: "",
  nutritional_calories: null,
  nutritional_protein: null,
  nutritional_carbs: null,
  nutritional_fat: null,
  seo_title: "",
  seo_description: "",
  tags: "",
};

export default function AdminMenuPage() {
  const { data, loading: isLoading, refetch } = useApiQuery("admin-menu", () =>
    apiFetch("/api/admin/menu")
  );

  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    async (form: typeof EMPTY & { id?: string }) => {
      const nutritionalInfo =
        form.nutritional_calories || form.nutritional_protein || form.nutritional_carbs || form.nutritional_fat
          ? {
              calories: form.nutritional_calories,
              protein: form.nutritional_protein,
              carbs: form.nutritional_carbs,
              fat: form.nutritional_fat,
            }
          : null;

      const payload = {
        name: form.name,
        slug: form.slug,
        style: form.style,
        variant: form.variant,
        description: form.description,
        short_description: form.short_description || null,
        price: Number(form.price),
        category: form.category,
        sub_category: form.sub_category || null,
        filling: form.filling || null,
        piece_count: form.piece_count,
        spice: Number(form.spice),
        image_url: form.image_url || null,
        gallery_images: form.gallery_images
          ? form.gallery_images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        badges: form.badges
          ? form.badges.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        sort_order: Number(form.sort_order),
        available: form.available,
        is_vegetarian: form.is_vegetarian,
        is_vegan: form.is_vegan,
        is_gluten_free: form.is_gluten_free,
        is_featured: form.is_featured,
        is_best_seller: form.is_best_seller,
        is_chef_special: form.is_chef_special,
        preparation_time: form.preparation_time,
        ingredients: form.ingredients || null,
        nutritional_info: nutritionalInfo,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        tags: form.tags
          ? form.tags.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (form.id) {
        return apiFetch(`/api/admin/menu/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        return apiFetch("/api/admin/menu", { method: "POST", body: JSON.stringify(payload) });
      }
    },
    {
      onSuccess: () => {
        toast.success("Saved");
        refetch();
        setEditing(null);
        setCreating(false);
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );

  const { mutate: doToggle } = useApiMutation(
    (item: Item) =>
      apiFetch(`/api/admin/menu/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ available: !item.available }),
      }),
    {
      onSuccess: () => refetch(),
    }
  );

  const { mutate: doDelete } = useApiMutation(
    (id: string) => apiFetch(`/api/admin/menu/${id}`, { method: "DELETE" }),
    {
      onSuccess: () => {
        toast.success("Deleted");
        refetch();
      },
      onError: (e) => toast.error(e.message || "Delete failed"),
    }
  );

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = (data ?? []) as Item[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Menu Items</h2>
          <p className="text-sm text-muted-foreground">{items.length} items in catalog</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
        >
          <Plus className="size-4" /> New item
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Highlights</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-border/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{it.description}</div>
                </td>
                <td className="px-4 py-3 text-xs">{it.category}{it.sub_category ? ` / ${it.sub_category}` : ""}</td>
                <td className="px-4 py-3">{it.variant}</td>
                <td className="px-4 py-3 font-[var(--font-num)]">₹{Number(it.price).toFixed(0)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {it.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">Featured</span>}
                    {it.is_best_seller && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Best Seller</span>}
                    {it.is_chef_special && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Chef Special</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      it.available
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {it.available ? "Available" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => doToggle(it)}
                      className="p-2 rounded hover:bg-background/60"
                      title={it.available ? "Hide" : "Show"}
                    >
                      {it.available ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button
                      onClick={() => setEditing(it)}
                      className="p-2 rounded hover:bg-background/60"
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${it.name}"?`)) doDelete(it.id);
                      }}
                      className="p-2 rounded hover:bg-destructive/15 text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No items yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ItemForm
          initial={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  slug: editing.slug,
                  style: editing.style,
                  variant: editing.variant,
                  description: editing.description,
                  short_description: editing.short_description ?? "",
                  price: editing.price,
                  category: editing.category,
                  sub_category: editing.sub_category ?? "",
                  filling: editing.filling ?? "",
                  piece_count: editing.piece_count,
                  spice: editing.spice,
                  image_url: editing.image_url ?? "",
                  gallery_images: (editing.gallery_images ?? []).join(", "),
                  badges: (editing.badges ?? []).join(", "),
                  sort_order: editing.sort_order,
                  available: editing.available,
                  is_vegetarian: editing.is_vegetarian,
                  is_vegan: editing.is_vegan,
                  is_gluten_free: editing.is_gluten_free,
                  is_featured: editing.is_featured,
                  is_best_seller: editing.is_best_seller,
                  is_chef_special: editing.is_chef_special,
                  preparation_time: editing.preparation_time,
                  ingredients: editing.ingredients ?? "",
                  nutritional_calories: editing.nutritional_info?.calories ?? null,
                  nutritional_protein: editing.nutritional_info?.protein ?? null,
                  nutritional_carbs: editing.nutritional_info?.carbs ?? null,
                  nutritional_fat: editing.nutritional_info?.fat ?? null,
                  seo_title: editing.seo_title ?? "",
                  seo_description: editing.seo_description ?? "",
                  tags: (editing.tags ?? []).join(", "),
                }
              : EMPTY
          }
          submitting={isSaving}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={(form) => doSave(form)}
        />
      )}
    </div>
  );
}

function ItemForm({
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  initial: typeof EMPTY & { id?: string };
  onClose: () => void;
  onSubmit: (form: typeof EMPTY & { id?: string }) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState(initial);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-card ring-1 ring-border p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl mb-4">{f.id ? "Edit item" : "New item"}</h3>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(f);
          }}
        >
          {/* Basic info */}
          <Field label="Product Name" required>
            <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" placeholder="e.g. Veg Steam Momo 4 Pcs" />
          </Field>
          <Field label="Slug" required>
            <input required value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="input" placeholder="veg-steam-momo-4-pcs" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Style (Cooking Method)" required>
              <input required value={f.style} onChange={(e) => setF({ ...f, style: e.target.value })} className="input" placeholder="Steam, Fried, Kurkure, Pan Fried…" />
            </Field>
            <Field label="Variant / Filling" required>
              <input required value={f.variant} onChange={(e) => setF({ ...f, variant: e.target.value })} className="input" placeholder="Veg, Paneer, Chicken, Veg Cheese…" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <input required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="input" placeholder="Steam Momos" />
            </Field>
            <Field label="Sub Category">
              <input value={f.sub_category} onChange={(e) => setF({ ...f, sub_category: e.target.value })} className="input" placeholder="Jhol, Darjeeling, Chilli…" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Filling Type">
              <input value={f.filling} onChange={(e) => setF({ ...f, filling: e.target.value })} className="input" placeholder="Veg, Veg Cheese, Paneer, Chicken…" />
            </Field>
            <Field label="Piece Count">
              <input type="number" min={0} max={99} value={f.piece_count ?? ""} onChange={(e) => setF({ ...f, piece_count: e.target.value ? Number(e.target.value) : null })} className="input" placeholder="4 or 8" />
            </Field>
          </div>
          <Field label="Short Description">
            <input value={f.short_description} onChange={(e) => setF({ ...f, short_description: e.target.value })} className="input" placeholder="Brief one-liner for cards" maxLength={200} />
          </Field>
          <Field label="Description">
            <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="input min-h-[80px]" maxLength={500} />
          </Field>

          {/* Pricing & ordering */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (₹)" required>
              <input required type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} className="input" />
            </Field>
            <Field label="Spice (1–3)">
              <input type="number" min={1} max={3} value={f.spice} onChange={(e) => setF({ ...f, spice: Number(e.target.value) })} className="input" />
            </Field>
            <Field label="Sort order">
              <input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} className="input" />
            </Field>
          </div>

          {/* Images */}
          <Field label="Image URL">
            <input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} className="input" placeholder="https://…" />
          </Field>
          <Field label="Gallery Images (comma separated URLs)">
            <input value={f.gallery_images} onChange={(e) => setF({ ...f, gallery_images: e.target.value })} className="input" placeholder="https://img1.jpg, https://img2.jpg" />
          </Field>

          {/* Dietary flags */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Dietary Flags</p>
            <div className="flex gap-4 flex-wrap">
              <Check label="Vegetarian" checked={f.is_vegetarian} set={(v) => setF({ ...f, is_vegetarian: v })} />
              <Check label="Vegan" checked={f.is_vegan} set={(v) => setF({ ...f, is_vegan: v })} />
              <Check label="Gluten Free" checked={f.is_gluten_free} set={(v) => setF({ ...f, is_gluten_free: v })} />
            </div>
          </div>

          {/* Highlight badges */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Highlight Badges</p>
            <div className="flex gap-4 flex-wrap">
              <Check label="Featured" checked={f.is_featured} set={(v) => setF({ ...f, is_featured: v })} />
              <Check label="Best Seller" checked={f.is_best_seller} set={(v) => setF({ ...f, is_best_seller: v })} />
              <Check label="Chef Special" checked={f.is_chef_special} set={(v) => setF({ ...f, is_chef_special: v })} />
            </div>
          </div>

          <Field label="Badges (comma separated)">
            <input value={f.badges} onChange={(e) => setF({ ...f, badges: e.target.value })} className="input" placeholder="Spicy, New, Popular" />
          </Field>
          <Field label="Tags (comma separated, for search/filter)">
            <input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} className="input" placeholder="momo, steam, veg, lunch" />
          </Field>

          {/* Preparation & Ingredients */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preparation Time (mins)">
              <input type="number" min={0} value={f.preparation_time ?? ""} onChange={(e) => setF({ ...f, preparation_time: e.target.value ? Number(e.target.value) : null })} className="input" placeholder="e.g. 10" />
            </Field>
          </div>
          <Field label="Ingredients">
            <textarea value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} className="input min-h-[60px]" placeholder="Flour, cabbage, onion, spices…" maxLength={1000} />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} />
            Available on menu
          </label>

          {/* Nutritional Info - collapsible */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              {showAdvanced ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              Nutritional Information
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-4 gap-3 mt-3 p-3 rounded-lg bg-background/40">
                <Field label="Calories (kcal)">
                  <input type="number" min={0} value={f.nutritional_calories ?? ""} onChange={(e) => setF({ ...f, nutritional_calories: e.target.value ? Number(e.target.value) : null })} className="input" />
                </Field>
                <Field label="Protein (g)">
                  <input type="number" min={0} value={f.nutritional_protein ?? ""} onChange={(e) => setF({ ...f, nutritional_protein: e.target.value ? Number(e.target.value) : null })} className="input" />
                </Field>
                <Field label="Carbs (g)">
                  <input type="number" min={0} value={f.nutritional_carbs ?? ""} onChange={(e) => setF({ ...f, nutritional_carbs: e.target.value ? Number(e.target.value) : null })} className="input" />
                </Field>
                <Field label="Fat (g)">
                  <input type="number" min={0} value={f.nutritional_fat ?? ""} onChange={(e) => setF({ ...f, nutritional_fat: e.target.value ? Number(e.target.value) : null })} className="input" />
                </Field>
              </div>
            )}
          </div>

          {/* SEO - collapsible */}
          <div>
            <button type="button" onClick={() => setShowSeo(!showSeo)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              {showSeo ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              SEO Metadata
            </button>
            {showSeo && (
              <div className="space-y-3 mt-3 p-3 rounded-lg bg-background/40">
                <Field label="SEO Title">
                  <input value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} className="input" placeholder="Meta title for search engines" maxLength={120} />
                </Field>
                <Field label="SEO Description">
                  <textarea value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="input min-h-[60px]" placeholder="Meta description" maxLength={300} />
                </Field>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg ring-1 ring-border hover:bg-background/60 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-glow disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
      <style>{`.input{width:100%;background:hsl(var(--background)/0.6);border:1px solid hsl(var(--border));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}

function Check({ label, checked, set }: { label: string; checked: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} />
      {label}
    </label>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
