import { useParams, Link } from "react-router-dom";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useCart, type CartAddon } from "@/lib/cart-store";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Flame, Leaf, Clock, ArrowLeft, Plus, X, ChevronRight,
  Heart, Share2, Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/site/PageHeader";

type Product = {
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
  tags: string[];
  addons: { _id: string; name: string; price: number }[];
};

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const add = useCart((s) => s.add);
  const { user } = useAuth();

  const { data, loading, error } = useApiQuery(
    `product-${slug}`,
    () => apiFetch(`/api/public/menu/${slug}`),
    { enabled: !!slug },
  );

  const product = data as Product | null;
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleAdd() {
    if (!product) return;
    const itemAddons = product.addons ?? [];
    if (itemAddons.length > 0) {
      setPickerOpen(true);
      return;
    }
    add({
      id: product.id,
      name: `${product.style} ${product.variant}`,
      price: product.price,
      image: product.image_url ?? undefined,
    });
    toast.success(`Added ${product.style} ${product.variant}`);
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  // --- Error / Not Found ---
  if (error || !product) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center max-w-md mx-auto space-y-4">
          <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-destructive/15 ring-1 ring-destructive/30">
            <X className="size-7 text-destructive" />
          </div>
          <h2 className="font-display text-2xl">Product not found</h2>
          <p className="text-sm text-muted-foreground">
            We couldn't find the product you're looking for. It may have been removed or the link may be incorrect.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
          >
            <ArrowLeft className="size-4" /> Back to menu
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = product.image_url;
  const allImages = [mainImage, ...(product.gallery_images ?? [])].filter(Boolean) as string[];
  const hasNutrition = product.nutritional_info && (
    product.nutritional_info.calories || product.nutritional_info.protein ||
    product.nutritional_info.carbs || product.nutritional_info.fat
  );

  return (
    <>
      <PageHeader
        eyebrow={product.category}
        title={product.name}
        subtitle={product.short_description || product.description}
      />

      <section className="py-12 md:py-20 relative">
        <div className="absolute inset-0 -z-10 bg-surface/40" />
        <div className="container-luxe">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10 flex-wrap">
            <Link to="/" className="hover:text-foreground transition">Home</Link>
            <ChevronRight className="size-3" />
            <Link to="/menu" className="hover:text-foreground transition">Menu</Link>
            <ChevronRight className="size-3" />
            <Link to={`/menu?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground transition">
              {product.category}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* --- Gallery --- */}
            <div>
              <div className="rounded-3xl ring-1 ring-border overflow-hidden bg-card aspect-square">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full grid place-items-center bg-background/60 text-muted-foreground">
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {allImages.map((src, i) => (
                    <button
                      key={i}
                      className="shrink-0 size-20 rounded-xl ring-1 ring-border overflow-hidden bg-card hover:ring-primary/40 transition"
                    >
                      <img src={src} alt={`${product.name} ${i + 1}`} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --- Details --- */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                {product.is_vegetarian && (
                  <span className="inline-flex items-center gap-1 bg-success/15 text-success kbd px-3 py-1.5 rounded-full text-xs">
                    <Leaf className="size-3" /> Vegetarian
                  </span>
                )}
                {product.is_vegan && (
                  <span className="inline-flex items-center gap-1 bg-success/15 text-success kbd px-3 py-1.5 rounded-full text-xs">
                    <Leaf className="size-3" /> Vegan
                  </span>
                )}
                {product.is_gluten_free && (
                  <span className="kbd px-3 py-1.5 rounded-full text-xs bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                    Gluten Free
                  </span>
                )}
                {product.is_best_seller && (
                  <span className="kbd px-3 py-1.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                    Best Seller
                  </span>
                )}
                {product.is_chef_special && (
                  <span className="kbd px-3 py-1.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                    Chef Special
                  </span>
                )}
                {product.is_featured && (
                  <span className="kbd px-3 py-1.5 rounded-full text-xs bg-primary/20 text-primary">
                    Featured
                  </span>
                )}
                {product.badges.map((b) => (
                  <span key={b} className="kbd px-3 py-1.5 rounded-full text-xs bg-primary/15 text-primary">
                    {b}
                  </span>
                ))}
              </div>

              {/* Name & Price */}
              <div>
                <h1 className="font-display text-3xl md:text-4xl">{product.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.style}{product.filling ? ` · ${product.filling}` : ""}
                  {product.piece_count ? ` · ${product.piece_count} Pieces` : ""}
                </p>
                <div className="flex items-baseline gap-4 mt-4">
                  <span className="font-display text-4xl text-primary">
                    ₹{Number(product.price).toFixed(0)}
                  </span>
                  {product.piece_count && (
                    <span className="text-sm text-muted-foreground">
                      ₹{(Number(product.price) / product.piece_count).toFixed(0)} per piece
                    </span>
                  )}
                </div>
              </div>

              {/* Quick info row */}
              <div className="flex gap-6 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Flame className="size-4 text-primary" />
                  <span>Spice level {product.spice}/3</span>
                </div>
                {product.preparation_time && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4 text-primary" />
                    <span>{product.preparation_time} mins</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              {/* Ingredients */}
              {product.ingredients && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Ingredients</h3>
                  <p className="text-sm text-muted-foreground">{product.ingredients}</p>
                </div>
              )}

              {/* Nutritional Info */}
              {hasNutrition && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Nutritional Information</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {product.nutritional_info?.calories != null && (
                      <div className="rounded-xl bg-background/60 ring-1 ring-border p-3 text-center">
                        <div className="font-display text-lg text-primary">{product.nutritional_info.calories}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">kcal</div>
                      </div>
                    )}
                    {product.nutritional_info?.protein != null && (
                      <div className="rounded-xl bg-background/60 ring-1 ring-border p-3 text-center">
                        <div className="font-display text-lg text-primary">{product.nutritional_info.protein}g</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Protein</div>
                      </div>
                    )}
                    {product.nutritional_info?.carbs != null && (
                      <div className="rounded-xl bg-background/60 ring-1 ring-border p-3 text-center">
                        <div className="font-display text-lg text-primary">{product.nutritional_info.carbs}g</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Carbs</div>
                      </div>
                    )}
                    {product.nutritional_info?.fat != null && (
                      <div className="rounded-xl bg-background/60 ring-1 ring-border p-3 text-center">
                        <div className="font-display text-lg text-primary">{product.nutritional_info.fat}g</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fat</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Addons summary */}
              {(product.addons ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Available Add-ons
                  </h3>
                  <ul className="space-y-1.5">
                    {product.addons.map((a) => (
                      <li key={a._id} className="flex items-center gap-2 text-sm">
                        <Check className="size-3.5 text-primary shrink-0" />
                        <span className="flex-1">{a.name}</span>
                        <span className="font-[var(--font-num)] text-primary">+₹{a.price.toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {product.tags.map((t) => (
                    <span key={t} className="kbd px-2.5 py-1 rounded-md text-[11px] bg-background/60 ring-1 ring-border text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow shadow-[var(--shadow-luxe)] transition"
                >
                  <Plus className="size-4" />
                  Add to order · ₹{Number(product.price).toFixed(0)}
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/product/${product.slug}`;
                    navigator.clipboard?.writeText(url)?.then(() => toast.success("Link copied"));
                  }}
                  className="shrink-0 inline-flex items-center justify-center size-12 rounded-xl ring-1 ring-border bg-card hover:bg-background/60 transition"
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </button>
                {user && (
                  <button
                    className="shrink-0 inline-flex items-center justify-center size-12 rounded-xl ring-1 ring-border bg-card hover:bg-background/60 transition"
                    aria-label="Save to favorites"
                  >
                    <Heart className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Addon picker modal */}
      {pickerOpen && product && (
        <AddonsPicker
          item={product}
          image={mainImage ?? undefined}
          onClose={() => setPickerOpen(false)}
          onConfirm={(selected) => {
            add({
              id: product.id,
              name: `${product.style} ${product.variant}`,
              price: product.price,
              image: mainImage ?? undefined,
              addons: selected,
            });
            toast.success(`Added ${product.style} ${product.variant}`);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

function AddonsPicker({
  item,
  image,
  onClose,
  onConfirm,
}: {
  item: Product;
  image?: string;
  onClose: () => void;
  onConfirm: (selected: CartAddon[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const addons = item.addons ?? [];
  const chosen: CartAddon[] = addons.filter((a) => selected[a._id]).map((a) => ({ id: a._id, name: a.name, price: a.price }));
  const extra = chosen.reduce((s, a) => s + a.price, 0);
  const total = Number(item.price) + extra;

  return (
    <div
      className="fixed inset-0 z-[80] bg-background/80 backdrop-blur grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-card ring-1 ring-border overflow-hidden"
      >
        <div className="relative aspect-[5/3] overflow-hidden">
          {image ? (
            <img src={image} alt={item.name} className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-items-center bg-background/60 text-muted-foreground text-sm">
              No image
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 grid place-items-center size-9 rounded-full bg-background/80 backdrop-blur ring-1 ring-border"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">
          <h3 className="font-display text-2xl">
            {item.style} <span className="text-muted-foreground">· {item.variant}</span>
          </h3>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-widest text-primary mb-2">Add-ons</p>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {addons.map((a) => (
                <li key={a._id}>
                  <label className="flex items-center gap-3 rounded-xl ring-1 ring-border bg-background/40 p-3 cursor-pointer hover:ring-primary/40 transition">
                    <input
                      type="checkbox"
                      checked={!!selected[a._id]}
                      onChange={(e) =>
                        setSelected((s) => ({ ...s, [a._id]: e.target.checked }))
                      }
                      className="size-4"
                    />
                    <span className="flex-1 text-sm">{a.name}</span>
                    <span className="font-[var(--font-num)] text-sm text-primary">
                      +₹{a.price.toFixed(0)}
                    </span>
                  </label>
                </li>
              ))}
              {addons.length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">No add-ons available</li>
              )}
            </ul>
          </div>

          <button
            onClick={() => onConfirm(chosen)}
            className="w-full mt-5 rounded-xl bg-primary text-primary-foreground py-3 font-semibold inline-flex items-center justify-center gap-2 shadow-[var(--shadow-luxe)]"
          >
            <Plus className="size-4" />
            Add to order · ₹{total.toFixed(0)}
          </button>
        </div>
      </div>
    </div>
  );
}
