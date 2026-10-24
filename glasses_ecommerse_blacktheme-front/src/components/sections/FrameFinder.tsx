import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { eyewearAttributes, products as productsAPI } from "@/lib/api";
import { type FrameType, type Shape, normalizeShape as normalize, slugifyShape as slugify, getShapeImage } from "@/lib/frameShapes";

// Guided frame finder: 1) who is it for (men / women / kids)  2) frame shape  3) shop results

type Gender = "men" | "women" | "kids";

const GENDERS: { key: Gender; label: string; image: string }[] = [
  { key: "men", label: "Men", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80" },
  { key: "women", label: "Women", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80" },
  { key: "kids", label: "Kids", image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80" },
];


const FrameFinder = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [frameType, setFrameType] = useState<FrameType>("eyeglasses");
  const [gender, setGender] = useState<Gender | null>(null);
  const [shapeCounts, setShapeCounts] = useState<Record<string, number> | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    eyewearAttributes.getByType("frameShape")
      .then((data: Shape[]) => setShapes(Array.isArray(data) ? data : []))
      .catch(() => setShapes([]));
  }, []);

  // How many products each shape has for the chosen gender + type (hide empty shapes)
  useEffect(() => {
    if (!gender) return;
    let cancelled = false;
    setLoadingCounts(true);
    setShapeCounts(null);
    productsAPI.list({ status: "active", category: frameType, gender, limit: 500 })
      .then((res: { products?: { eyewearDetails?: { frameShape?: string } }[] } | { eyewearDetails?: { frameShape?: string } }[]) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res.products || [];
        const counts: Record<string, number> = {};
        list.forEach((p) => {
          const key = normalize(p.eyewearDetails?.frameShape);
          if (key) counts[key] = (counts[key] || 0) + 1;
        });
        setShapeCounts(counts);
      })
      .catch(() => { if (!cancelled) setShapeCounts({}); })
      .finally(() => { if (!cancelled) setLoadingCounts(false); });
    return () => { cancelled = true; };
  }, [gender, frameType]);

  const shapeImage = (shape: Shape) => getShapeImage(shape, frameType);

  // Shapes that actually have products; if counting found none at all, show every shape
  const visibleShapes = useMemo(() => {
    if (!shapeCounts) return shapes;
    const withProducts = shapes.filter((s) => (shapeCounts[normalize(s.name)] || 0) > 0);
    return withProducts.length > 0 ? withProducts : shapes;
  }, [shapes, shapeCounts]);

  const totalForGender = shapeCounts ? Object.values(shapeCounts).reduce((a, b) => a + b, 0) : 0;
  const genderLabel = GENDERS.find((g) => g.key === gender)?.label || "";
  const typeLabel = frameType === "eyeglasses" ? "Eyeglasses" : "Sunglasses";

  return (
    <section className="py-10 lg:py-16 bg-background border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-1.5">
              {gender ? "Step 2 of 2 · Choose a frame shape" : "Step 1 of 2 · Who is it for?"}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-playfair">
              {gender ? `${genderLabel}'s ${typeLabel}` : "Find Your Perfect Frame"}
            </h2>
          </div>

          {/* Eyeglasses / Sunglasses */}
          <div className="inline-flex self-start sm:self-auto rounded-full border border-white/10 bg-white/[0.04] p-1">
            {(["eyeglasses", "sunglasses"] as FrameType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFrameType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${frameType === t ? "bg-amber-400 text-black" : "text-slate-300 hover:text-white"}`}
              >
                {t === "eyeglasses" ? "Eyeglasses" : "Sunglasses"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!gender ? (
            /* Step 1: gender */
            <motion.div
              key="genders"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 gap-3 sm:gap-5 lg:gap-8"
            >
              {GENDERS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGender(g.key)}
                  className="group text-left"
                >
                  <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[5/4] overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900 ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-amber-400/70 transition-all">
                    <img src={g.image} alt={g.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-base sm:text-2xl font-bold text-white font-playfair leading-tight">{g.label}</p>
                        <p className="hidden sm:block text-xs text-white/70 mt-0.5">Choose frame shape</p>
                      </div>
                      <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white group-hover:bg-amber-400 group-hover:text-black transition-colors">
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            /* Step 2: frame shapes for that gender */
            <motion.div
              key={`shapes-${gender}-${frameType}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setGender(null)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-amber-400/60 hover:text-amber-400 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change
                </button>
                {GENDERS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGender(g.key)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${gender === g.key ? "bg-white text-black" : "border border-white/10 text-slate-300 hover:text-white"}`}
                  >
                    {g.label}
                  </button>
                ))}
                <Link
                  to={`/shop?category=${frameType}&gender=${gender}`}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
                >
                  View all{shapeCounts ? ` (${totalForGender})` : ""} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {shapes.length === 0 ? (
                <p className="text-sm text-slate-400 py-8">
                  Frame shapes are not set up yet.{" "}
                  <Link to={`/shop?category=${frameType}&gender=${gender}`} className="text-amber-400 font-bold hover:underline">Browse all {genderLabel.toLowerCase()}'s {typeLabel.toLowerCase()} →</Link>
                </p>
              ) : (
                <div className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5 transition-opacity ${loadingCounts ? "opacity-60" : ""}`}>
                  {visibleShapes.map((shape) => {
                    const count = shapeCounts?.[normalize(shape.name)];
                    return (
                      <Link
                        key={shape._id}
                        to={`/shop?category=${frameType}&gender=${gender}&frameShape=${slugify(shape.name)}`}
                        className="group flex flex-col items-center"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-amber-400/70 transition-all">
                          <img src={shapeImage(shape)} alt={shape.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <span className="mt-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-200 group-hover:text-amber-400 transition-colors text-center">
                          {shape.name}
                        </span>
                        {count !== undefined && count > 0 && (
                          <span className="text-[10px] text-slate-500">{count} style{count > 1 ? "s" : ""}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FrameFinder;
