import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { eyewearAttributes, products as productsAPI } from "@/lib/api";
import { type FrameType, type Shape, normalizeShape, slugifyShape, getShapeImage } from "@/lib/frameShapes";

// Step between a homepage category card (e.g. "Men" under Eyeglasses) and the shop:
// the customer picks a frame shape first, or skips with "View all".

interface ShapePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string; // e.g. "Men's Eyeglasses"
  href: string; // shop link of the card, e.g. /shop?category=eyeglasses&gender=men
  frameType: FrameType;
}

let shapesCache: Shape[] | null = null;

type ProductLite = { eyewearDetails?: { frameShape?: string } };

const ShapePickerDialog = ({ open, onOpenChange, title, href, frameType }: ShapePickerDialogProps) => {
  const navigate = useNavigate();
  const [shapes, setShapes] = useState<Shape[] | null>(shapesCache);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  useEffect(() => {
    if (!open || shapesCache) return;
    eyewearAttributes.getByType("frameShape")
      .then((data: Shape[]) => { shapesCache = Array.isArray(data) ? data : []; setShapes(shapesCache); })
      .catch(() => { shapesCache = []; setShapes([]); });
  }, [open]);

  // No shapes configured in admin: nothing to choose, go straight to the shop
  useEffect(() => {
    if (open && shapes && shapes.length === 0) go(href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shapes]);

  // Count products per shape using the same filters as the card link (category, gender, sale, ...)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCounts(null);
    const params = new URLSearchParams(href.split("?")[1] || "");
    productsAPI.list({
      status: "active",
      limit: 500,
      category: params.get("category") || frameType,
      gender: params.get("gender") || undefined,
      brand: params.get("brand") || undefined,
      search: params.get("search") || undefined,
      sale: params.get("sale") === "true" ? true : undefined,
    })
      .then((res: ProductLite[] | { products?: ProductLite[] }) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res.products || [];
        const next: Record<string, number> = {};
        list.forEach((p) => {
          const key = normalizeShape(p.eyewearDetails?.frameShape);
          if (key) next[key] = (next[key] || 0) + 1;
        });
        setCounts(next);
      })
      .catch(() => { if (!cancelled) setCounts({}); });
    return () => { cancelled = true; };
  }, [open, href, frameType]);

  // Only shapes that have products here; if none match at all, show every shape
  const visible = useMemo(() => {
    if (!shapes) return [];
    if (!counts) return shapes;
    const withProducts = shapes.filter((s) => (counts[normalizeShape(s.name)] || 0) > 0);
    return withProducts.length > 0 ? withProducts : shapes;
  }, [shapes, counts]);

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;
  const shapeHref = (shape: Shape) => `${href}${href.includes("?") ? "&" : "?"}frameShape=${encodeURIComponent(slugifyShape(shape.name))}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-2xl gap-0 border-white/10 bg-[#111112] p-0 text-white [&>button]:hidden
          max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">Choose a frame shape</p>
            <DialogTitle className="mt-1 text-xl font-bold font-playfair text-white">{title}</DialogTitle>
            <DialogDescription className="sr-only">Pick a frame shape to see matching products, or view all.</DialogDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!shapes ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />)}
            </div>
          ) : (
            <div className={`grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 transition-opacity ${counts ? "" : "opacity-70"}`}>
              {visible.map((shape) => {
                const count = counts?.[normalizeShape(shape.name)];
                return (
                  <button key={shape._id} type="button" onClick={() => go(shapeHref(shape))} className="group flex flex-col items-center text-center">
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 transition-all group-hover:ring-2 group-hover:ring-amber-400/70">
                      <img src={getShapeImage(shape, frameType)} alt={shape.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <span className="mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-200 group-hover:text-amber-400">{shape.name}</span>
                    {count !== undefined && count > 0 && <span className="text-[10px] text-slate-500">{count} style{count > 1 ? "s" : ""}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={() => go(href)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 py-3 text-sm font-bold text-amber-400 transition-colors hover:bg-amber-400/10"
          >
            View all {title.toLowerCase()}{total !== null ? ` (${total})` : ""} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShapePickerDialog;
